import { feature } from "@turf/turf";
import axios from "axios";
import ArrayStore from "devextreme/data/array_store";
import CustomStore from "devextreme/data/custom_store";
import "devextreme/ui/check_box";
import "devextreme/ui/check_box";
import dxDataGrid from "devextreme/ui/data_grid";
import "devextreme/ui/data_grid";
import dxFileUploader from "devextreme/ui/file_uploader";
import "devextreme/ui/file_uploader";
import dxForm from "devextreme/ui/form";
import dxPopup from "devextreme/ui/popup";
import "devextreme/ui/popup";
import dxSelectBox from "devextreme/ui/select_box";

import { AttributesEditorComponent } from "../../../../../libs/core/components/attributes-editor/attributes-editor.component";
import { AttributesWindowComponent, AttributesWindowOption } from "../../../../../libs/core/components/attributes-window/attributes-window.component";
import { RazorView } from "../../../../../libs/core/decorators/razor-view.decorator";
import { EnumDanhMucNhomBanDo, EnumDataType, EnumStatus } from "../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../libs/core/helpers/utils";
import { Layout } from "../../../../../libs/core/layout";
import { OGMapModel } from "../../../../../libs/core/models/map.model";
import { OGTableColumnModel } from "../../../../../libs/core/models/table.model";
import { MapService } from "../../../../../libs/core/services/map.service";
import "./form.view.scss";

@RazorView()
class FormView extends Layout {
    FormGrid: dxDataGrid;
    FormStore: CustomStore;
    attributeEditor: AttributesEditorComponent;
    attributesWindowComponent: AttributesWindowComponent;
    copyDataForm: dxForm;
    copyDataPopup: dxPopup;
    copyFieldsForm: dxForm;
    copyFieldsPopup: dxPopup;
    dragForm: dxForm;
    dragGrid: dxDataGrid;
    dragPopup: dxPopup;
    editMapForm: dxForm;
    editMapPopup: dxPopup;
    formContainer: JQuery<HTMLElement>;
    formId = 0;
    importGrid: dxDataGrid;
    importPopup: dxPopup;
    importUploader: dxFileUploader;
    infoGrid: dxDataGrid;
    infoPopup: dxPopup;
    layerStore: CustomStore;
    mapStore: CustomStore<OGMapModel, number>;
    newForm: dxForm;
    newFormFieldGrid: dxDataGrid;
    newFormPopup: dxPopup;
    rawColumns: OGTableColumnModel[] = [];
    rawDragGrid: dxDataGrid;
    schema: string;
    selectedColumns: OGTableColumnModel[] = [];
    showSelect: boolean;
    tableSchemaStore: CustomStore;
    constructor() {
        super("child");
        $("#header").find(".header-title >span").html("Quản lý biểu mẫu");
        this.schema = OGUtils.getUrlParams("schema");
        this.showSelect = this.schema == undefined;
        $(".tab-item-container").css({
            "background-color": "white"
        }).height(window.innerHeight - $("header").outerHeight());
    }

    private initFormGrid(): void {
        this.FormGrid = $("<div />").appendTo(this.formContainer).dxDataGrid({
            columns: [{
                caption: "Bảng dữ liệu",
                dataField: "tableInfo.name_vn",
                groupIndex: 0,
            }, {
                caption: "Tên biểu mẫu",
                dataField: "name",
            }, {
                caption: "Ngày cập nhật",
                dataField: "date_updated",
                dataType: "datetime",
                format: "dd/MM/yyyy HH:mm",
            }, {
                caption: "Kích hoạt",
                dataField: "is_enabled",
                dataType: "boolean",
            }, {
                allowEditing: false,
                caption: "Thao tác",
                cellTemplate: (container, options) => {
                    $("<div>").appendTo(container).dxToolbar({
                        items: [
                            // {
                            //     location: "center",
                            //     options: {
                            //         hint: "Sao chép dữ liệu",
                            //         icon: "icon icon-copy-success",
                            //         onClick: () => {
                            //             this.formId = options.data.id;
                            //             this.copyDataPopup.show();
                            //         },
                            //         type: "default"
                            //     },
                            //     widget: "dxButton"
                            // }, {
                            //     location: "center",
                            //     options: {
                            //         hint: "Đồng bộ dữ liệu",
                            //         icon: "icon icon-repeate-music",
                            //         onClick: () => {
                            //             setTimeout(() => {
                            //                 OGUtils.alert("Đồng bộ dữ liệu thành công");
                            //             }, 3000);
                            //         },
                            //         type: "default"
                            //     },
                            //     widget: "dxButton"
                            // }, {
                            //     location: "center",
                            //     options: {
                            //         hint: options.data.is_enabled ? "Bỏ kích hoạt" : "Kích hoạt",
                            //         icon: options.data.is_enabled ? "icon icon-close-square" : "icon icon-tick-square",
                            //         onClick: () => {
                            //             OGUtils.confirm((options.data.is_enabled ? "Bỏ kích hoạt" : "Kích hoạt") + " biểu mẫu này?").then(value => {
                            //                 if (value) {
                            //                     options.data.is_enabled = !options.data.is_enabled;
                            //                     options.component.getDataSource().store().update(options.data.id, options.data).then(() => {
                            //                         options.component.getDataSource().reload();
                            //                     });
                            //                 }
                            //             });
                            //         },
                            //         type: options.data.is_enabled ? "danger" : "success"
                            //     },
                            //     widget: "dxButton"
                            // }, {
                            //     location: "center",
                            //     options: {
                            //         hint: "Thông tin giám sát",
                            //         icon: "icon icon-document-forward",
                            //         onClick: () => {
                            //             this.formId = options.data.id;
                            //             this.infoGrid.getDataSource().reload();
                            //             this.infoPopup.show();
                            //         },
                            //         type: "default"
                            //     },
                            //     widget: "dxButton"
                            // }, {
                            //     location: "center",
                            //     options: {
                            //         icon: "icon icon-edit-2",
                            //         onClick: () => {
                            //             $.get("/api/form?id=" + options.data.id).done(xhr => {
                            //                 if (xhr.status === EnumStatus.OK) {
                            //                     const data = xhr.data;
                            //                     this.newForm.option("formData", data);
                            //                     this.newForm.option("formData.table_schema", data.tableInfo.table_schema);
                            //                     this.newForm.option("formData.layer_id", data.layer.id);
                            //                     this.newForm.option("formData.isCreatedUser", data.user_id === data.created_by);
                            //                     this.newFormFieldGrid.selectRows(data.form_fields.map(item => item.table_column_id), false);
                            //                     this.newFormPopup.show();
                            //                 }
                            //             });
                            //         },
                            //         type: "success"
                            //     },
                            //     widget: "dxButton"
                            // }, {
                            //     location: "center",
                            //     options: {
                            //         icon: "icon icon-trash",
                            //         onClick: () => {
                            //             OGUtils.confirm("Xóa biểu mẫu này?").then(value => {
                            //                 if (value) {
                            //                     options.component.getDataSource().store().remove(options.value).then(() => {
                            //                         options.component.getDataSource().reload();
                            //                     });
                            //                 }
                            //             });
                            //         },
                            //         type: "danger"
                            //     },
                            //     widget: "dxButton"
                            // },
                            {
                                location: "center",
                                options: {
                                    displayExpr: "value",
                                    dropDownOptions: {
                                        type: "default",
                                        width: 150,
                                    },
                                    icon: "icon icon-setting-2",
                                    items: [{
                                        id: "data",
                                        value: "Thông tin dữ liệu"
                                    }, {
                                        id: "copy-data",
                                        value: "Sao chép dữ liệu"
                                    }, {
                                        id: "copy-fields",
                                        value: "Sao chép trường dữ liệu"
                                    }, {
                                        id: "sync",
                                        value: "Đồng bộ dữ liệu"
                                    }, {
                                        id: "info",
                                        value: "Thông tin giám sát"
                                    }, {
                                        id: "enable",
                                        value: options.data.is_enabled ? "Bỏ kích hoạt" : "Kích hoạt",
                                    }, {
                                        id: "map",
                                        value: "Thông tin bản đồ",
                                    }, {
                                        id: "edit",
                                        value: "Chỉnh sửa"
                                    }, {
                                        id: "delete",
                                        value: "Xóa"
                                    }],
                                    onItemClick: (e) => {
                                        if (e.itemData) {
                                            switch (e.itemData.id) {
                                                case "data":
                                                    this.attributesWindowComponent.for(options.data.layer, undefined, {
                                                        "form": options.data
                                                    }).show();
                                                    break;
                                                case "copy-data":
                                                    this.formId = options.data.id;
                                                    (this.copyDataForm.getEditor("source_id") as dxSelectBox).getDataSource().reload();
                                                    this.copyDataPopup.show();
                                                    break;
                                                case "copy-fields":
                                                    this.formId = options.data.id;
                                                    (this.copyFieldsForm.getEditor("source_id") as dxSelectBox).getDataSource().reload();
                                                    this.copyFieldsPopup.show();
                                                    break;
                                                case "sync":
                                                    setTimeout(() => {
                                                        OGUtils.alert("Đồng bộ dữ liệu thành công");
                                                    }, 3000);
                                                    break;
                                                case "info":
                                                    this.formId = options.data.id;
                                                    this.infoGrid.getDataSource().reload();
                                                    this.infoPopup.show();
                                                    break;
                                                case "enable":
                                                    OGUtils.confirm((options.data.is_enabled ? "Bỏ kích hoạt" : "Kích hoạt") + " biểu mẫu này?").then(value => {
                                                        if (value) {
                                                            options.data.is_enabled = !options.data.is_enabled;
                                                            options.component.getDataSource().store().update(options.data.id, options.data).then(() => {
                                                                options.component.getDataSource().reload();
                                                            });
                                                        }
                                                    });
                                                    break;
                                                case "edit":
                                                    $.get("/api/form?id=" + options.data.id).done(xhr => {
                                                        if (xhr.status === EnumStatus.OK) {
                                                            const data = xhr.data;
                                                            this.newForm.option("formData", data);
                                                            this.newForm.option("formData.table_schema", data.tableInfo.table_schema);
                                                            this.newForm.option("formData.layer_id", data.layer.id);
                                                            this.newForm.option("formData.isCreatedUser", data.user_id === data.created_by);
                                                            this.newFormFieldGrid.selectRows(data.form_fields.map(item => item.table_column_id), false);
                                                            this.newFormPopup.show();
                                                        }
                                                    });
                                                    break;
                                                case "map":
                                                    if (options.data.map_id) {
                                                        MapService.get(options.data.map_id).then(data => {
                                                            this.editMapForm.option("formData", data);
                                                            this.editMapPopup.show();
                                                        });
                                                    }
                                                    else {
                                                        OGUtils.alert("Chưa có thông tin bản đồ! Vui lòng cập nhật thông tin bản đồ");
                                                    }
                                                    break;
                                                case "delete":
                                                    OGUtils.confirm("Xóa biểu mẫu này?").then(value => {
                                                        if (value) {
                                                            options.component.getDataSource().store().remove(options.value).then(() => {
                                                                options.component.getDataSource().reload();
                                                            });
                                                        }
                                                    });
                                                    break;
                                                default:
                                                    break;
                                            }
                                        }
                                    },
                                    text: "Thao tác",
                                    valueExpr: "id",
                                },
                                widget: "dxDropDownButton"
                            }, {
                                location: "center",
                                options: {
                                    displayExpr: "value",
                                    dropDownOptions: {
                                        type: "success",
                                    },
                                    icon: "icon icon-export-1",
                                    items: [{
                                        id: "csv",
                                        value: "CSV"
                                    }, {
                                        id: "xlsx",
                                        value: "Excel"
                                    }, {
                                        id: "geodatabase",
                                        value: "Geodatabase"
                                    }, {
                                        id: "shp",
                                        value: "Shapefile"
                                    }],
                                    onItemClick: (e) => {
                                        if (e.itemData) {
                                            let extension;
                                            if (e.itemData.id === "xlsx") {
                                                extension = ".xlsx";
                                            } else if (e.itemData.id === "csv") {
                                                extension = ".csv";
                                            } else if (e.itemData.id === "shp") {
                                                extension = ".zip";
                                            } else if (e.itemData.id === "geodatabase") {
                                                extension = ".gdb";
                                            }
                                            OGUtils.postDownload(`/api/form/export?id=${options.value}&f=${e.itemData.id}`, options.data.name + extension);
                                        }
                                    },
                                    text: "Xuất biểu mẫu",
                                    valueExpr: "id"
                                },
                                widget: "dxDropDownButton"
                            }]
                    });
                },
                dataField: "id",
                width: 350,
            }],
            dataSource: {
                store: this.FormStore
            },
            errorRowEnabled: false,
            groupPanel: {
                visible: false   // or "auto"
            },
            grouping: {
                contextMenuEnabled: true
            },
            height: "100%",
            loadPanel: {
                text: "Đang tải dữ liệu"
            },
            noDataText: "Không có dữ liệu",
            onContentReady: (e) => {
                e.element.find(".dx-datagrid-header-panel > .dx-toolbar").css("padding-bottom", "5px").css("margin", "0");
            },
            onEditorPreparing: (e) => {
                //this.LayerInfo = e.row.data;
                //
                // if (e.parentType == "dataRow") {
                //     if (e.dataField === "geom") {
                //         e.editorOptions.disabled = !e.row.inserted;
                //     }
                // }
            },
            onRowUpdating: function (options) {
                $.extend(options.newData, $.extend({}, options.oldData, options.newData));
            },
            onToolbarPreparing: (e) => {
                const dataGrid = e.component;
                e.toolbarOptions.items.unshift({
                    location: "before",
                    options: {
                        onClick: (e) => {
                            this.importPopup.show();
                        },
                        text: "Nhập thông tin từ biểu mẫu"
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        onClick: (e) => {
                            this.newForm.option("formData", {});
                            this.newFormPopup.show();
                        },
                        text: "Tạo biểu mẫu"
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        onClick: (e) => {
                            this.dragForm.option("formData", {});
                            this.dragPopup.show();
                        },
                        text: "Tạo biểu mẫu kéo thả"
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        icon: "refresh",
                        onClick: (e) => {
                            dataGrid.getDataSource().reload();
                        }
                    },
                    widget: "dxButton"
                });
            },
            pager: {
                allowedPageSizes: [15, 25, 50],
                infoText: "{2} bản ghi",
                showInfo: true,
                showNavigationButtons: true,
                showPageSizeSelector: true,
                visible: true
            },
            paging: {
                enabled: true,
                pageSize: 15
            },
            scrolling: {
                showScrollbar: "always"
            },
            selection: {
                mode: "none"
            },
            showBorders: true,
            showRowLines: true,
            width: "100%"
        }).dxDataGrid("instance");
    }
    private initLayout(): void {
        this.initFormGrid();
    }
    protected onInit(): void {
        this.formContainer = $("#form-container");
        this.attributesWindowComponent = new AttributesWindowComponent(null, {
            attributeEditors: new AttributesEditorComponent(null),
            oGConfig: this.config,
            showButton: true
        } as AttributesWindowOption);
        this.mapStore = new CustomStore({
            byKey: (key) => {
                return MapService.get(key);
            },
            insert: (values) => {
                return MapService.save(values);
            },
            key: "id",
            load: (loadOptions) => {
                const deferred = $.Deferred(), args: { [key: string]: number | string } = {};

                if (loadOptions.sort) {
                    args.orderby = loadOptions.sort[0].selector;
                    if (loadOptions.sort[0].desc)
                        args.orderby += " desc";
                }
                args.skip = loadOptions.skip ? loadOptions.skip : 0;
                args.take = loadOptions.take ? loadOptions.take : 50;
                MapService.list(args).then(result => {
                    if (result) {
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
                return MapService.delete({ id: key });
            },
            update: (key, values) => {
                return MapService.save(values);
            },
        });
        this.tableSchemaStore = new CustomStore({
            byKey: (key) => {
                const deferred = $.Deferred(),
                    args = {};
                if (key) {
                    $.get("/api/table/schema/" + key.toString()).done(xhr => {
                        if (xhr && xhr.status === "OK") {
                            deferred.resolve(xhr.data);
                        }
                        //
                        deferred.resolve({});
                    });
                } else {
                    deferred.resolve({});
                }
                return deferred;
            },
            key: "schema_name",
            load: (loadOptions) => {
                const deferred = $.Deferred(),
                    args = {};
                $.get("/api/table/schema/list").done(xhr => {
                    if (xhr && xhr.status === "OK") {
                        deferred.resolve(xhr.data);
                    }
                    //
                    deferred.resolve({});
                });
                return deferred;
            }
        });
        this.layerStore = new CustomStore({
            byKey: (key) => {
                const deferred = $.Deferred(),
                    args = {};
                $.get("/api/layer/" + key.toString()).done(xhr => {
                    if (xhr && xhr.status === "OK") {
                        deferred.resolve(xhr.data);
                    }
                    //
                    deferred.resolve({});
                });
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
                args.take = loadOptions.take ? loadOptions.take : 99999;
                //
                $.ajax({
                    contentType: "application/json",
                    // data: {
                    //     id: this.LayerGroupId
                    // },
                    dataType: "json",
                    error: () => {
                        deferred.reject("Data Loading Error");
                    },
                    success: (result) => {
                        deferred.resolve(result.data, {
                            totalCount: result.data.length
                        });
                    },
                    timeout: 8000,
                    type: "get",
                    url: "/api/layer/" + this.schema + "/getLayers"
                });

                return deferred.promise();
            }
        });
        this.FormStore = new CustomStore({
            byKey: (key) => {
                const deferred = $.Deferred(),
                    args = {};
                $.get("/api/layer/group/" + key.toString()).done(xhr => {
                    if (xhr && xhr.status === "OK") {
                        deferred.resolve(xhr.data);
                    }
                    //
                    deferred.resolve({});
                });
                return deferred;
            },
            key: "id",
            load: (loadOptions) => {
                const deferred = $.Deferred(),
                    args: { [key: string]: CustomStore | number | string } = {};

                if (loadOptions.sort) {
                    args.orderby = loadOptions.sort[0].selector;
                    if (loadOptions.sort[0].desc)
                        args.orderby += " desc";
                }

                args.skip = loadOptions.skip ? loadOptions.skip : 0;
                args.take = loadOptions.take ? loadOptions.take : 99999;
                args.table_schema = this.schema;
                //
                $.ajax({
                    error: () => {
                        deferred.reject("Data Loading Error");
                    },
                    // contentType: 'application/json',
                    success: (result) => {
                        deferred.resolve(result.data, {
                            totalCount: result.data.length
                        });
                    },
                    // data: JSON.stringify(args),
                    type: "get",
                    url: this.schema ? ("/api/form/listAll?schema=" + this.schema) : "/api/form/listAll",
                    // timeout: 5000
                });

                return deferred.promise();
            },
            remove: (key) => {
                return $.ajax({
                    contentType: "application/json",
                    data: JSON.stringify({ id: key }),
                    type: "post",
                    url: "/api/form/delete"
                });
            },
            update: (key, value) => {
                return $.post("/api/form/update", { dataForm: JSON.stringify(value) });
            }
        });
        this.editMapPopup = $("<div />").appendTo("body").dxPopup({
            closeOnOutsideClick: false,
            contentTemplate: (container) => {
                // container.css('padding', '0');
                this.editMapForm = $("<div />").appendTo(container).dxForm({
                    items: [{
                        dataField: "parent_id",
                        editorOptions: {
                            dataSource: [{
                                id: 0,
                                mo_ta: "Không thuộc nhóm bản đồ nào"
                            },
                            {
                                id: EnumDanhMucNhomBanDo.CAYXANH.id,
                                mo_ta: EnumDanhMucNhomBanDo.CAYXANH.text
                            },
                            {
                                id: EnumDanhMucNhomBanDo.CHIEUSANG.id,
                                mo_ta: EnumDanhMucNhomBanDo.CHIEUSANG.text
                            },
                            {
                                id: EnumDanhMucNhomBanDo.CAPNUOC.id,
                                mo_ta: EnumDanhMucNhomBanDo.CAPNUOC.text
                            },
                            {
                                id: EnumDanhMucNhomBanDo.THOATNUOC.id,
                                mo_ta: EnumDanhMucNhomBanDo.THOATNUOC.text
                            },
                            {
                                id: EnumDanhMucNhomBanDo.KHUCU_KHUDOTHI.id,
                                mo_ta: EnumDanhMucNhomBanDo.KHUCU_KHUDOTHI.text
                            },
                            {
                                id: EnumDanhMucNhomBanDo.KHU_NGHIATRANG.id,
                                mo_ta: EnumDanhMucNhomBanDo.KHU_NGHIATRANG.text
                            },
                            {
                                id: EnumDanhMucNhomBanDo.TUYNEN.id,
                                mo_ta: EnumDanhMucNhomBanDo.TUYNEN.text
                            },
                            {
                                id: EnumDanhMucNhomBanDo.KHU_CONGNGHIEP.id,
                                mo_ta: EnumDanhMucNhomBanDo.KHU_CONGNGHIEP.text
                            }],
                            displayExpr: "mo_ta",
                            valueExpr: "id"
                        },
                        editorType: "dxSelectBox",
                        label: {
                            text: "Nhóm bản đồ"
                        },
                    },
                    {
                        dataField: "name",
                        editorOptions: {
                            disable: true
                        },
                        label: {
                            text: "Tên bản đồ"
                        },
                        validationRules: [{
                            message: "Vui lòng nhập tên bản đồ",
                            type: "required"
                        }]
                    },
                    {
                        dataField: "description",
                        label: {
                            text: "Mô tả"
                        },
                    },
                    {
                        dataField: "center",
                        label: {
                            text: "Tâm bản đồ",
                        }
                    }, {
                        dataField: "defaultzoom",
                        label: {
                            text: "Mức zoom mặc định",
                        },
                    }, {
                        dataField: "minzoom",
                        label: {
                            text: "Mức zoom nhỏ nhất",
                        },
                    }, {
                        dataField: "maxzoom",
                        label: {
                            text: "Mức zoom lớn nhất",
                        },
                    }, {
                        dataField: "cluster",
                        editorType: "dxCheckBox",
                        label: {
                            text: "Hiển thị dữ liệu theo cụm?",
                        },
                    },
                    {
                        colSpan: 2,
                        template: () => {
                            return "<hr style=\"margin: 5px 0;\" />";
                        }
                    }, {
                        buttonOptions: {
                            onClick: () => {
                                const validate = this.editMapForm.validate();
                                if (validate.status !== "invalid") {
                                    MapService.save(this.editMapForm.option("formData")).then(data => {
                                        if (data) {
                                            OGUtils.alert("Lưu thông tin biểu mẫu thành công!");
                                        } else {
                                            OGUtils.error("Lưu thông tin biểu mẫu thất bại!");
                                        }
                                        //
                                        this.editMapForm.option("formData", {});
                                        this.editMapPopup.hide();
                                    });
                                }
                            },
                            stylingMode: "contained",
                            text: "Lưu thông tin",
                            type: "default"
                        },
                        colSpan: 2,
                        horizontalAlignment: "center",
                        itemType: "button"
                    }]
                }).dxForm("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: "auto",
            onOptionChanged: (e) => {

            },
            resizeEnabled: false,
            // position: {
            //     at: 'left bottom',
            //     of: 'body',
            //     offset: "525 -125"
            shading: true,
            // },
            showCloseButton: true,
            showTitle: true,
            title: "Thông tin bản đồ",
            width: 500,
        }).dxPopup("instance");
        this.newFormPopup = $("<div />").appendTo("body").dxPopup({
            closeOnOutsideClick: false,
            contentTemplate: (container) => {
                // container.css('padding', '0');
                this.newForm = $("<div />").appendTo(container).dxForm({
                    items: [{
                        dataField: "user_id",
                        editorOptions: {
                            dataSource: {
                                store: new CustomStore({
                                    byKey: (key) => {
                                        const deferred = $.Deferred();
                                        $.get("/api/user/" + key.toString()).done(xhr => {
                                            if (xhr && xhr.status === EnumStatus.OK) {
                                                deferred.resolve(xhr.data);
                                            }
                                            deferred.resolve({});
                                        });
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
                                        $.ajax({
                                            error: () => {
                                                deferred.reject("Data Loading Error");
                                            },
                                            success: (xhr) => {
                                                deferred.resolve({
                                                    data: xhr.data,
                                                    totalCount: xhr.data.length
                                                });
                                            },
                                            type: "get",
                                            url: "/api/group/users",
                                        });
                                        return deferred.promise();
                                    },
                                }),
                            },
                            displayExpr: "user_info.full_name",
                            showClearButton: true,
                            valueExpr: "id"
                        },
                        editorType: "dxSelectBox",
                        label: {
                            text: "Phân quyền người dùng"
                        },
                    }, {
                        dataField: "table_schema",
                        editorOptions: {
                            dataSource: {
                                store: this.tableSchemaStore,
                            },
                            displayExpr: "description",
                            onValueChanged: (e) => {
                                this.schema = e.value;
                                this.newFormFieldGrid.clearSelection();
                                const newFormEditor = this.newForm.getEditor("layer_id");
                                if (newFormEditor && newFormEditor instanceof dxSelectBox) {
                                    newFormEditor.reset();
                                    newFormEditor.getDataSource().reload();
                                }
                            },
                            valueExpr: "schema_name"
                        },
                        editorType: "dxSelectBox",
                        label: {
                            text: "Schema dữ liệu"
                        },
                        validationRules: [{
                            message: "Vui lòng chọn Schema",
                            type: this.showSelect ? "required" : "custom"
                        }],
                        visible: this.showSelect
                    }, {
                        dataField: "layer_id",
                        editorOptions: {
                            dataSource: {
                                store: this.layerStore,
                            },
                            displayExpr: "name_vn",
                            onValueChanged: (e) => {
                                this.newFormFieldGrid.clearSelection();
                                this.newFormFieldGrid.getDataSource().reload();
                            },
                            valueExpr: "id"
                        },
                        editorType: "dxSelectBox",
                        label: {
                            text: "Lớp dữ liệu"
                        },
                        validationRules: [{
                            message: "Vui lòng chọn lớp dữ liệu",
                            type: "required"
                        }]
                    }, {
                        dataField: "name",
                        label: {
                            text: "Tên biểu mẫu"
                        },
                        validationRules: [{
                            message: "Vui lòng nhập tên biểu mẫu",
                            type: "required"
                        }]
                    }, {
                        dataField: "include_data",
                        editorType: "dxCheckBox",
                        label: {
                            text: "Bổ sung dữ liệu?"
                        },
                        visible: false,
                    }, {
                        dataField: "isCreatedUser",
                        editorType: "dxCheckBox",
                        label: {
                            text: "Gán người xử lý là người tạo?"
                        },
                    }, {
                        dataField: "map_id",
                        editorOptions: {
                            dataSource: {
                                store: this.mapStore,
                            },
                            displayExpr: "name",
                            showClearButton: true,
                            valueExpr: "id"
                        },
                        editorType: "dxSelectBox",
                        label: {
                            text: "Bản đồ nền"
                        },
                    }, {
                        colSpan: 2,
                        template: (itemData, itemElement) => {
                            this.newFormFieldGrid = $("<div />").appendTo(itemElement).dxDataGrid({
                                columns: [{
                                    caption: "Tên trường",
                                    dataField: "column_name"
                                }, {
                                    caption: "Mô tả",
                                    dataField: "name_vn"
                                }, {
                                    caption: "Kiểu dữ liệu",
                                    dataField: "data_type",
                                    lookup: {
                                        dataSource: {
                                            store: new ArrayStore({
                                                data: [{
                                                    text: "Tự tăng",
                                                    type: "serial"
                                                }, {
                                                    text: "Số nguyên",
                                                    type: "integer"
                                                }, {
                                                    text: "Chuỗi ký tự",
                                                    type: "character varying"
                                                }, {
                                                    text: "Văn bản",
                                                    type: "text"
                                                }, {
                                                    text: "Ngày tháng",
                                                    type: "date"
                                                }, {
                                                    text: "Ngày tháng kèm thời gian",
                                                    type: "timestamp without time zone"
                                                }, {
                                                    text: "Số thập phân",
                                                    type: "double precision"
                                                }, {
                                                    text: "Số thực",
                                                    type: "real"
                                                }, {
                                                    text: "Boolean",
                                                    type: "boolean"
                                                }, {
                                                    text: "Tự định nghĩa",
                                                    type: "USER-DEFINED"
                                                }],
                                                key: "type"
                                            })
                                        },
                                        displayExpr: "text",
                                        valueExpr: "type"
                                    },
                                    width: 100
                                }],
                                dataSource: {
                                    store: new CustomStore({
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
                                            args.take = loadOptions.take ? loadOptions.take : 99999;
                                            //
                                            if (this.newForm) {
                                                $.ajax({
                                                    data: {
                                                        id: this.newForm.option("formData")?.layer_id ?? 0
                                                    },
                                                    error: () => {
                                                        deferred.reject("Data Loading Error");
                                                    },
                                                    success: (xhr) => {
                                                        if (xhr && xhr.status === "OK") {
                                                            const cleanColumns = $.grep(xhr.data, (item: { [key: string]: boolean | number | string }) => {
                                                                return item.column_name !== "geom"
                                                                    && item.column_name !== "is_delete"
                                                                    && item.column_name !== "commune_id"
                                                                    && item.column_name !== "district_id"
                                                                    && item.column_name !== "province_id"
                                                                    && item.column_name !== "insert_time"
                                                                    && item.column_name !== "last_update"
                                                                    && item.is_identity === false;
                                                            });
                                                            deferred.resolve(cleanColumns, {
                                                                totalCount: cleanColumns.length
                                                            });
                                                        } else {
                                                            deferred.resolve([], {
                                                                totalCount: 0
                                                            });
                                                        }
                                                    },
                                                    type: "get",
                                                    url: "/api/layer/get-fields",
                                                    // timeout: 5000
                                                });
                                            } else {
                                                deferred.resolve([], {
                                                    totalCount: 0
                                                });
                                            }

                                            return deferred.promise();
                                        }
                                    })
                                },
                                errorRowEnabled: false,
                                height: 250,
                                loadPanel: {
                                    text: "Đang tải dữ liệu"
                                },
                                noDataText: "Không có dữ liệu",
                                scrolling: {
                                    showScrollbar: "always"
                                },
                                selection: {
                                    mode: "multiple",
                                    showCheckBoxesMode: "always"
                                },
                                showBorders: true,
                                showRowLines: true,
                                width: "100%"
                            }).dxDataGrid("instance");
                        }
                    }, {
                        colSpan: 2,
                        template: () => {
                            return "<hr style=\"margin: 5px 0;\" />";
                        }
                    }, {
                        buttonOptions: {
                            onClick: () => {
                                const validate = this.newForm.validate();
                                if (validate.status !== "invalid") {
                                    const columns = this.newFormFieldGrid.getSelectedRowsData();
                                    if (columns.length > 0) {
                                        const data = this.newForm.option("formData");
                                        if (data.isCreatedUser) {
                                            data.created_by = data.user_id;
                                        }
                                        data.form_fields = [];
                                        // data.layer_id = data.layer?.id || 0;
                                        columns.forEach(col => {
                                            data.form_fields.push({
                                                label: col.name_vn,
                                                table_column_id: col.id,
                                            });
                                        });
                                        if (data.id > 0) {
                                            $.post("/api/form/update", { dataForm: JSON.stringify(data) }).done(xhr => {
                                                if (xhr.status === "OK") {
                                                    OGUtils.alert("Lưu thông tin biểu mẫu thành công!");
                                                } else {
                                                    OGUtils.error("Lưu thông tin biểu mẫu thất bại!");
                                                }
                                                //
                                                this.FormGrid.getDataSource().reload();
                                                this.newFormPopup.hide();
                                            });
                                        } else {
                                            $.post("/api/form/create", { dataForm: JSON.stringify(data) }).done(xhr => {
                                                if (xhr.status === "OK") {
                                                    OGUtils.alert("Tạo biểu mẫu thành công!");
                                                } else {
                                                    OGUtils.error("Tạo biểu mẫu thất bại!");
                                                }
                                                //
                                                this.FormGrid.getDataSource().reload();
                                                this.newFormPopup.hide();
                                            });
                                        }
                                    } else {
                                        OGUtils.alert("Vui lòng chọn ít nhất 1 trường dữ liệu!");
                                    }
                                }
                            },
                            stylingMode: "contained",
                            text: "Lưu thông tin",
                            type: "default"
                        },
                        colSpan: 2,
                        horizontalAlignment: "center",
                        itemType: "button"
                    }]
                }).dxForm("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: "auto",
            onOptionChanged: (e) => {

            },
            resizeEnabled: false,
            // position: {
            //     at: 'left bottom',
            //     of: 'body',
            //     offset: "525 -125"
            shading: true,
            // },
            showCloseButton: true,
            showTitle: true,
            title: "Thông tin biểu mẫu",
            width: 500,
        }).dxPopup("instance");
        this.dragPopup = $("<div />").appendTo("body").dxPopup({
            closeOnOutsideClick: false,
            contentTemplate: (container) => {
                // container.css('padding', '0');
                this.dragForm = $("<div />").appendTo(container).dxForm({
                    colCount: 2,
                    items: [{
                        dataField: "table_schema",
                        editorOptions: {
                            dataSource: {
                                store: this.tableSchemaStore,
                            },
                            displayExpr: "description",
                            onValueChanged: (e) => {
                                this.schema = e.value;
                                this.newFormFieldGrid.clearSelection();
                                const newFormEditor = this.newForm.getEditor("layer_id");
                                if (newFormEditor && newFormEditor instanceof dxSelectBox) {
                                    newFormEditor.reset();
                                    newFormEditor.getDataSource().reload();
                                }
                            },
                            valueExpr: "schema_name"
                        },
                        editorType: "dxSelectBox",
                        label: {
                            text: "Schema dữ liệu"
                        },
                        validationRules: [{
                            message: "Vui lòng chọn Schema",
                            type: this.showSelect ? "required" : "custom"
                        }],
                        visible: this.showSelect
                    }, {
                        dataField: "layer_id",
                        editorOptions: {
                            dataSource: {
                                store: this.layerStore,
                            },
                            displayExpr: "name_vn",
                            onValueChanged: (e) => {
                                OGUtils.showLoading();
                                $.ajax({
                                    data: {
                                        id: this.dragForm.option("formData")?.layer_id ?? 0
                                    },
                                    success: (xhr) => {
                                        OGUtils.hideLoading();
                                        if (xhr && xhr.status === "OK") {
                                            this.rawColumns = xhr.data.filter(item => {
                                                return item.column_name !== "geom"
                                                    && item.column_name !== "is_delete"
                                                    && item.column_name !== "commune_id"
                                                    && item.column_name !== "district_id"
                                                    && item.column_name !== "province_id"
                                                    && item.column_name !== "insert_time"
                                                    && item.column_name !== "last_update"
                                                    && item.is_identity === false;
                                            });
                                        } else {
                                            this.rawColumns = [];
                                        }
                                        this.selectedColumns = [];
                                        this.rawDragGrid.beginUpdate();
                                        this.rawDragGrid.option("dataSource", this.rawColumns);
                                        this.rawDragGrid.endUpdate();
                                        this.dragGrid.beginUpdate();
                                        this.dragGrid.option("dataSource", this.selectedColumns);
                                        this.dragGrid.endUpdate();
                                    },
                                    type: "get",
                                    url: "/api/layer/get-fields",
                                });
                            },
                            valueExpr: "id"
                        },
                        editorType: "dxSelectBox",
                        label: {
                            text: "Lớp dữ liệu"
                        },
                        validationRules: [{
                            message: "Vui lòng chọn lớp dữ liệu",
                            type: "required"
                        }]
                    }, {
                        dataField: "name",
                        label: {
                            text: "Tên biểu mẫu"
                        },
                        validationRules: [{
                            message: "Vui lòng nhập tên biểu mẫu",
                            type: "required"
                        }]
                    }, {
                        dataField: "user_id",
                        editorOptions: {
                            dataSource: {
                                store: new CustomStore({
                                    byKey: (key) => {
                                        const deferred = $.Deferred();
                                        $.get("/api/user/" + key.toString()).done(xhr => {
                                            if (xhr && xhr.status === EnumStatus.OK) {
                                                deferred.resolve(xhr.data);
                                            }
                                            deferred.resolve({});
                                        });
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
                                        $.ajax({
                                            error: () => {
                                                deferred.reject("Data Loading Error");
                                            },
                                            success: (xhr) => {
                                                deferred.resolve({
                                                    data: xhr.data,
                                                    totalCount: xhr.data.length
                                                });
                                            },
                                            type: "get",
                                            url: "/api/group/users",
                                        });
                                        return deferred.promise();
                                    },
                                }),
                            },
                            displayExpr: "user_info.full_name",
                            showClearButton: true,
                            valueExpr: "id"
                        },
                        editorType: "dxSelectBox",
                        label: {
                            text: "Phân quyền người dùng"
                        },
                    }, {
                        template: () => {

                        },
                        visible: !this.showSelect
                    }, {

                        label: {
                            location: "top",
                            text: "Trường dữ liệu gốc"
                        },
                        template: (itemData, itemElement) => {
                            this.rawDragGrid = $("<div />").appendTo(itemElement).dxDataGrid({
                                columns: [{
                                    caption: "Tên trường",
                                    dataField: "column_name"
                                }, {
                                    caption: "Mô tả",
                                    dataField: "name_vn"
                                }, {
                                    caption: "Kiểu dữ liệu",
                                    dataField: "data_type",
                                    lookup: {
                                        dataSource: {
                                            store: new ArrayStore({
                                                data: [{
                                                    text: "Tự tăng",
                                                    type: "serial"
                                                }, {
                                                    text: "Số nguyên",
                                                    type: "integer"
                                                }, {
                                                    text: "Chuỗi ký tự",
                                                    type: "character varying"
                                                }, {
                                                    text: "Văn bản",
                                                    type: "text"
                                                }, {
                                                    text: "Ngày tháng",
                                                    type: "date"
                                                }, {
                                                    text: "Ngày tháng kèm thời gian",
                                                    type: "timestamp without time zone"
                                                }, {
                                                    text: "Số thập phân",
                                                    type: "double precision"
                                                }, {
                                                    text: "Số thực",
                                                    type: "real"
                                                }, {
                                                    text: "Boolean",
                                                    type: "boolean"
                                                }, {
                                                    text: "Tự định nghĩa",
                                                    type: "USER-DEFINED"
                                                }],
                                                key: "type"
                                            })
                                        },
                                        displayExpr: "text",
                                        valueExpr: "type"
                                    },
                                    width: 100
                                }],
                                dataSource: {
                                    store: new CustomStore({
                                        key: "id",
                                        load: () => {
                                            return this.rawColumns;
                                        }
                                    })
                                },
                                errorRowEnabled: false,
                                height: 250,
                                loadPanel: {
                                    text: "Đang tải dữ liệu"
                                },
                                noDataText: "Không có dữ liệu",
                                paging: { enabled: false },
                                rowDragging: {
                                    data: this.rawColumns,
                                    group: "tasksGroup",
                                    onAdd: (e) => {
                                        this.rawColumns.push(e.itemData);
                                        this.rawDragGrid.beginUpdate();
                                        this.rawDragGrid.option("dataSource", this.rawColumns);
                                        this.rawDragGrid.endUpdate();
                                    },
                                    onRemove: (e) => {
                                        const index = this.rawColumns.indexOf(e.itemData);
                                        if (index > -1) { // only splice array when item is found
                                            this.rawColumns.splice(index, 1); // 2nd parameter means remove one item only
                                        }
                                        this.rawDragGrid.beginUpdate();
                                        this.rawDragGrid.option("dataSource", this.rawColumns);
                                        this.rawDragGrid.endUpdate();
                                    },
                                },
                                scrolling: {
                                    showScrollbar: "always"
                                },
                                showBorders: true,
                                showRowLines: true,
                                width: "100%"
                            }).dxDataGrid("instance");
                        }
                    }, {

                        label: {
                            location: "top",
                            text: "Trường dữ liệu biểu mẫu"
                        },
                        template: (itemData, itemElement) => {
                            this.dragGrid = $("<div />").appendTo(itemElement).dxDataGrid({
                                columns: [{
                                    caption: "Tên trường",
                                    dataField: "column_name"
                                }, {
                                    caption: "Mô tả",
                                    dataField: "name_vn"
                                }, {
                                    caption: "Kiểu dữ liệu",
                                    dataField: "data_type",
                                    lookup: {
                                        dataSource: {
                                            store: new ArrayStore({
                                                data: [{
                                                    text: "Tự tăng",
                                                    type: "serial"
                                                }, {
                                                    text: "Số nguyên",
                                                    type: "integer"
                                                }, {
                                                    text: "Chuỗi ký tự",
                                                    type: "character varying"
                                                }, {
                                                    text: "Văn bản",
                                                    type: "text"
                                                }, {
                                                    text: "Ngày tháng",
                                                    type: "date"
                                                }, {
                                                    text: "Ngày tháng kèm thời gian",
                                                    type: "timestamp without time zone"
                                                }, {
                                                    text: "Số thập phân",
                                                    type: "double precision"
                                                }, {
                                                    text: "Số thực",
                                                    type: "real"
                                                }, {
                                                    text: "Boolean",
                                                    type: "boolean"
                                                }, {
                                                    text: "Tự định nghĩa",
                                                    type: "USER-DEFINED"
                                                }],
                                                key: "type"
                                            })
                                        },
                                        displayExpr: "text",
                                        valueExpr: "type"
                                    },
                                    width: 100
                                }],
                                dataSource: {
                                    store: new CustomStore({
                                        key: "id",
                                        load: () => {
                                            return this.selectedColumns;
                                        }
                                    }),
                                },
                                errorRowEnabled: false,
                                height: 250,
                                loadPanel: {
                                    text: "Đang tải dữ liệu"
                                },
                                noDataText: "Không có dữ liệu",
                                paging: { enabled: false },
                                rowDragging: {
                                    data: this.selectedColumns,
                                    group: "tasksGroup",
                                    onAdd: (e) => {
                                        this.selectedColumns.push(e.itemData);
                                        this.dragGrid.beginUpdate();
                                        this.dragGrid.option("dataSource", this.selectedColumns);
                                        this.dragGrid.endUpdate();
                                    },
                                    onRemove: (e) => {
                                        const index = this.selectedColumns.indexOf(e.itemData);
                                        if (index > -1) { // only splice array when item is found
                                            this.selectedColumns.splice(index, 1); // 2nd parameter means remove one item only
                                        }
                                        this.dragGrid.beginUpdate();
                                        this.dragGrid.option("dataSource", this.selectedColumns);
                                        this.dragGrid.endUpdate();
                                    },
                                },
                                scrolling: {
                                    showScrollbar: "always"
                                },
                                showBorders: true,
                                showRowLines: true,
                                width: "100%"
                            }).dxDataGrid("instance");
                        }
                    }, {
                        colSpan: 2,
                        template: () => {
                            return "<hr style=\"margin: 5px 0;\" />";
                        }
                    }, {
                        buttonOptions: {
                            onClick: () => {
                                const validate = this.dragForm.validate();
                                if (validate.status !== "invalid") {
                                    if (this.selectedColumns.length > 0) {
                                        const data = this.dragForm.option("formData");
                                        data.form_fields = [];
                                        // data.layer_id = data.layer?.id || 0;
                                        this.selectedColumns.forEach(col => {
                                            data.form_fields.push({
                                                label: col.name_vn,
                                                table_column_id: col.id,
                                            });
                                        });
                                        if (data.id > 0) {
                                            $.post("/api/form/update", { dataForm: JSON.stringify(data) }).done(xhr => {
                                                if (xhr.status === "OK") {
                                                    OGUtils.alert("Lưu thông tin biểu mẫu thành công!");
                                                } else {
                                                    OGUtils.error("Lưu thông tin biểu mẫu thất bại!");
                                                }
                                                //
                                                this.dragPopup.hide();
                                                this.FormGrid.getDataSource().reload();
                                            });
                                        } else {
                                            $.post("/api/form/create", { dataForm: JSON.stringify(data) }).done(xhr => {
                                                if (xhr.status === "OK") {
                                                    OGUtils.alert("Tạo biểu mẫu thành công!");
                                                } else {
                                                    OGUtils.error("Tạo biểu mẫu thất bại!");
                                                }
                                                //
                                                this.dragPopup.hide();
                                                this.FormGrid.getDataSource().reload();
                                            });
                                        }
                                    } else {
                                        OGUtils.alert("Vui lòng chọn ít nhất 1 trường dữ liệu!");
                                    }
                                }
                            },
                            stylingMode: "contained",
                            text: "Lưu thông tin",
                            type: "default"
                        },
                        colSpan: 2,
                        horizontalAlignment: "center",
                        itemType: "button"
                    }]
                }).dxForm("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: "auto",
            onHidden: (e) => {
                this.dragForm.option("formData", {});
                this.selectedColumns = [];
                this.rawColumns = [];
                this.rawDragGrid.beginUpdate();
                this.rawDragGrid.option("dataSource", this.rawColumns);
                this.rawDragGrid.endUpdate();
                this.dragGrid.beginUpdate();
                this.dragGrid.option("dataSource", this.selectedColumns);
                this.dragGrid.endUpdate();
            },
            resizeEnabled: false,
            // position: {
            //     at: 'left bottom',
            //     of: 'body',
            //     offset: "525 -125"
            shading: true,
            // },
            showCloseButton: true,
            showTitle: true,
            title: "Thông tin biểu mẫu",
            width: "auto",
        }).dxPopup("instance");

        this.importPopup = $("<div />").appendTo("body").dxPopup({
            closeOnOutsideClick: false,
            contentTemplate: (container) => {
                $("<div />").appendTo(container).dxForm({
                    items: [{
                        template: (data, element) => {
                            // element.css("margin", "auto");
                            this.importUploader = $("<div />").appendTo(element).dxFileUploader({
                                allowedFileExtensions: [".xlsx"],
                                labelText: "Chọn file excel nhập liệu (.xlsx)",
                                maxFileSize: 1048576,
                                multiple: false,
                                onUploaded: function (e) {
                                    e.element.find(".dx-fileuploader-remove-button").show();
                                },
                                onValueChanged: function (e) {
                                    const values = e.component.option("values");
                                    $.each(values, function (index, value) {
                                        e.element.find(".dx-fileuploader-upload-button").hide();
                                    });
                                    e.element.find(".dx-fileuploader-upload-button").hide();
                                },
                                selectButtonText: "Chọn tệp",
                                showFileList: true,
                                uploadMode: "useButtons"
                            }).dxFileUploader("instance");
                        }
                    }, {
                        cssClass: "button-container",
                        template: (data, element) => {
                            $("<div />").appendTo(element).dxButton({
                                onClick: () => {
                                    const data = new FormData();
                                    const files = this.importUploader.option("value");
                                    if (files.length === 0) {
                                        OGUtils.alert("Vui lòng chọn file cần nhập liệu", "Thông báo!");
                                        return false;
                                    }
                                    if (!this.importUploader["_files"][0].isValid()) {
                                        OGUtils.alert("Vui lòng chọn đúng định dạng file", "Thông báo!");
                                        return false;
                                    }
                                    data.append("fileData", files[0]);
                                    OGUtils.showLoading();
                                    $.ajax({
                                        cache: false,
                                        contentType: false,
                                        data: data,
                                        dataType: "json",
                                        processData: false,
                                        success: (xhr) => {
                                            OGUtils.hideLoading();
                                            if (xhr.status === "OK") {
                                                const columns = xhr.data.table.columns.map(col => {
                                                    if (col.visible && !col.column_name.includes("geom")
                                                        && col.column_name !== "commune_id"
                                                        && col.column_name !== "district_id"
                                                        && col.column_name !== "province_id") {
                                                        return {
                                                            // width: 200,
                                                            alignment: "left",
                                                            allowResizing: true,
                                                            allowSorting: false,
                                                            calculateCellValue: (data) => {
                                                                if (col.data_type === EnumDataType.date || col.data_type === EnumDataType.dateTime) {
                                                                    const date = new Date(data[col.column_name]);
                                                                    const value = col.data_type === EnumDataType.date ? `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}` : `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
                                                                    return value;
                                                                } else {
                                                                    return data[col.column_name] == undefined ? "" : data[col.column_name];
                                                                }
                                                            },
                                                            caption: col.name_vn,
                                                            dataField: col.column_name
                                                        };
                                                    }
                                                });
                                                columns.push({
                                                    caption: "Lỗi",
                                                    dataField: "error",
                                                });
                                                this.importGrid.option("columns", columns);
                                                this.importGrid.option("dataSource", xhr.data.items[xhr.data.table.table_name]);
                                            } else {
                                                if (xhr.data) {
                                                    OGUtils.alert(xhr.data);
                                                }
                                            }
                                        },
                                        type: "POST",
                                        url: "/api/form/parseData"
                                    });

                                },
                                stylingMode: "contained",
                                text: "Tải lên",
                                type: "success",
                                visible: true,
                                width: 120,
                            }).dxButton("instance");
                        }
                    }, {
                        template: (data, element) => {
                            return "<hr style='margin: 5px 0;' />";
                        }
                    }, {
                        label: {
                            location: "top",
                            text: "Kết quả nhập liệu"
                        },
                        template: (data, element) => {
                            this.importGrid = $("<div />").appendTo(element).dxDataGrid({
                                columnAutoWidth: true,
                                errorRowEnabled: false,
                                height: 350,
                                loadPanel: {
                                    text: "Đang tải dữ liệu"
                                },
                                noDataText: "Không có dữ liệu",
                                onContentReady: () => {
                                    //this.GridContainer.find('.dx-datagrid-header-panel').css('padding', '0 5px');
                                },
                                pager: {
                                    allowedPageSizes: [15, 25, 50],
                                    infoText: "{2} bản ghi",
                                    showInfo: true,
                                    showNavigationButtons: true,
                                    showPageSizeSelector: true,
                                    visible: true
                                },
                                paging: {
                                    enabled: true,
                                    pageSize: 15
                                },
                                selection: {
                                    mode: "single",
                                    showCheckBoxesMode: "none"
                                },
                                showBorders: true,
                                visible: true,
                                width: "100%"
                            }).dxDataGrid("instance");
                        }
                    }]
                });
            },
            deferRendering: false,
            dragEnabled: false,
            height: "auto",
            onHidden: () => {
                this.importUploader.reset();
            },
            onOptionChanged: (e) => {

            },
            resizeEnabled: false,
            shading: true,
            showCloseButton: true,
            showTitle: true,
            title: "Nhập thông tin từ biểu mẫu",
            width: 450,
        }).dxPopup("instance");

        this.infoPopup = $("<div />").appendTo("body").dxPopup({
            closeOnOutsideClick: false,
            contentTemplate: (container) => {
                this.infoGrid = $("<div />").appendTo(container).dxDataGrid({
                    columnAutoWidth: true,
                    columns: [{
                        caption: "Thời gian thao tác",
                        dataField: "action_at",
                        dataType: "datetime",
                        format: "dd/MM/yyyy HH:mm",
                    }, {
                        caption: "Số bản ghi thành công",
                        dataField: "success_counter"
                    }, {
                        caption: "Số bản ghi không thành công",
                        dataField: "fail_counter"
                    }, {
                        caption: "Người thao tác",
                        dataField: "user_action",
                        lookup: {
                            dataSource: {
                                store: new CustomStore({
                                    byKey: (key) => {
                                        const deferred = $.Deferred();
                                        $.get("/api/user/" + key.toString()).done(xhr => {
                                            if (xhr && xhr.status === EnumStatus.OK) {
                                                deferred.resolve(xhr.data);
                                            }
                                            deferred.resolve({});
                                        });
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
                                        $.ajax({
                                            error: () => {
                                                deferred.reject("Data Loading Error");
                                            },
                                            success: (xhr) => {
                                                deferred.resolve({
                                                    data: xhr.data,
                                                    totalCount: xhr.data.length
                                                });
                                            },
                                            type: "get",
                                            url: "/api/group/users",
                                        });
                                        return deferred.promise();
                                    },
                                }),
                            },
                            displayExpr: "user_info.full_name",
                            valueExpr: "id"
                        },
                        width: 100
                    }],
                    dataSource: {
                        store: new CustomStore({
                            key: "id",
                            load: () => {
                                const deferred = $.Deferred();

                                $.ajax({
                                    error: () => {
                                        deferred.reject("Data Loading Error");
                                    },
                                    success: (xhr) => {
                                        deferred.resolve({
                                            data: xhr.data,
                                            totalCount: xhr.data.length
                                        });
                                    },
                                    type: "get",
                                    url: "/api/form/actions?form_id=" + this.formId,
                                });
                                return deferred.promise();
                            }
                        }),
                    },
                    errorRowEnabled: false,
                    height: 350,
                    loadPanel: {
                        text: "Đang tải dữ liệu"
                    },
                    noDataText: "Không có dữ liệu",
                    onContentReady: () => {
                        //this.GridContainer.find('.dx-datagrid-header-panel').css('padding', '0 5px');
                    },
                    pager: {
                        allowedPageSizes: [15, 25, 50],
                        infoText: "{2} bản ghi",
                        showInfo: true,
                        showNavigationButtons: true,
                        showPageSizeSelector: true,
                        visible: true
                    },
                    paging: {
                        enabled: true,
                        pageSize: 15
                    },
                    selection: {
                        mode: "single",
                        showCheckBoxesMode: "none"
                    },
                    showBorders: true,
                    visible: true,
                    width: "auto"
                }).dxDataGrid("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: "auto",
            onOptionChanged: (e) => {

            },
            resizeEnabled: false,
            shading: true,
            showCloseButton: true,
            showTitle: true,
            title: "Thông tin giám sát biểu mẫu",
            width: "auto",
        }).dxPopup("instance");

        this.copyDataPopup = $("<div />").appendTo("body").dxPopup({
            closeOnOutsideClick: false,
            contentTemplate: (container) => {
                this.copyDataForm = $("<div />").appendTo(container).dxForm({
                    items: [{
                        dataField: "source_id",
                        editorOptions: {
                            dataSource: {
                                store: new CustomStore({
                                    key: "id",
                                    load: (loadOptions) => {
                                        const deferred = $.Deferred();
                                        $.ajax({
                                            error: () => {
                                                deferred.reject("Data Loading Error");
                                            },
                                            // contentType: 'application/json',
                                            success: (result) => {
                                                deferred.resolve(result.data, {
                                                    totalCount: result.data.length
                                                });
                                            },
                                            // data: JSON.stringify(args),
                                            type: "get",
                                            url: "/api/form/listAll?excludeFormId=" + this.formId,
                                            // timeout: 5000
                                        });
                                        return deferred.promise();
                                    },
                                }),
                            },
                            displayExpr: "name",
                            valueExpr: "id"
                        },
                        editorType: "dxSelectBox",
                        label: {
                            text: "Biểu mẫu dữ liệu"
                        },
                        validationRules: [{
                            message: "Vui lòng chọn biểu mẫu",
                            type: "required"
                        }]
                    }, {
                        colSpan: 2,
                        template: () => {
                            return "<hr style=\"margin: 5px 0;\" />";
                        }
                    }, {
                        buttonOptions: {
                            onClick: () => {
                                const validate = this.copyDataForm.validate();
                                if (validate.status !== "invalid") {
                                    const data = this.copyDataForm.option("formData");
                                    data.form_id = this.formId;
                                    OGUtils.showLoading();
                                    axios.post("/api/form/copy/data", data).then(xhr => {
                                        if (xhr.data.status === "OK") {
                                            OGUtils.alert("Sao chép mẫu thành công!");
                                        } else {
                                            OGUtils.error("Sao chép biểu mẫu thất bại!");
                                        }
                                        //
                                        this.copyDataForm.resetValues();
                                        this.copyDataPopup.hide();
                                    });
                                }
                            },
                            stylingMode: "contained",
                            text: "Sao chép dữ liệu",
                            type: "default"
                        },
                        colSpan: 2,
                        horizontalAlignment: "center",
                        itemType: "button"
                    }]
                }).dxForm("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: "auto",
            onOptionChanged: (e) => {

            },
            resizeEnabled: false,
            shading: true,
            showCloseButton: true,
            showTitle: true,
            title: "Sao chép dữ liệu từ biểu mẫu",
            width: "auto",
        }).dxPopup("instance");
        this.copyFieldsPopup = $("<div />").appendTo("body").dxPopup({
            closeOnOutsideClick: false,
            contentTemplate: (container) => {
                this.copyFieldsForm = $("<div />").appendTo(container).dxForm({
                    items: [{
                        dataField: "source_id",
                        editorOptions: {
                            dataSource: {
                                store: new CustomStore({
                                    key: "id",
                                    load: (loadOptions) => {
                                        const deferred = $.Deferred();
                                        $.ajax({
                                            error: () => {
                                                deferred.reject("Data Loading Error");
                                            },
                                            // contentType: 'application/json',
                                            success: (result) => {
                                                deferred.resolve(result.data, {
                                                    totalCount: result.data.length
                                                });
                                            },
                                            // data: JSON.stringify(args),
                                            type: "get",
                                            url: "/api/form/listAll?excludeFormId=" + this.formId,
                                            // timeout: 5000
                                        });
                                        return deferred.promise();
                                    },
                                }),
                            },
                            displayExpr: "name",
                            valueExpr: "id"
                        },
                        editorType: "dxSelectBox",
                        label: {
                            text: "Biểu mẫu dữ "
                        },
                        validationRules: [{
                            message: "Vui lòng chọn biểu mẫu",
                            type: "required"
                        }]
                    }, {
                        colSpan: 2,
                        template: () => {
                            return "<hr style=\"margin: 5px 0;\" />";
                        }
                    }, {
                        buttonOptions: {
                            onClick: () => {
                                const validate = this.copyFieldsForm.validate();
                                if (validate.status !== "invalid") {
                                    const data = this.copyFieldsForm.option("formData");
                                    data.form_id = this.formId;
                                    OGUtils.showLoading();
                                    axios.post("/api/form/copy/fields", data).then(xhr => {
                                        if (xhr.data.status === "OK") {
                                            OGUtils.alert("Sao chép trường thông tin thành công!");
                                        } else {
                                            OGUtils.error("Sao chép trường thông tin thất bại!");
                                        }
                                        //
                                        this.copyFieldsForm.resetValues();
                                        this.copyFieldsPopup.hide();
                                    });
                                }
                            },
                            stylingMode: "contained",
                            text: "Sao chép dữ liệu",
                            type: "default"
                        },
                        colSpan: 2,
                        horizontalAlignment: "center",
                        itemType: "button"
                    }]
                }).dxForm("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: "auto",
            onOptionChanged: (e) => {

            },
            resizeEnabled: false,
            shading: true,
            showCloseButton: true,
            showTitle: true,
            title: "Sao chép trường thông tin từ biểu mẫu",
            width: "auto",
        }).dxPopup("instance");
        this.initLayout();
    }
}