import { LoadOptions } from "devextreme/data";
import ArrayStore from "devextreme/data/array_store";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import "devextreme/ui/data_grid";
import dxDataGrid, { ColumnCellTemplateData, EditorPreparingEvent } from "devextreme/ui/data_grid";
import dxFileUploader from "devextreme/ui/file_uploader";
import "devextreme/ui/form";
import dxForm from "devextreme/ui/form";
import "devextreme/ui/multi_view";
import dxMultiView from "devextreme/ui/multi_view";
import "devextreme/ui/popup";
import dxPopup from "devextreme/ui/popup";
import "devextreme/ui/select_box";
import dxSelectBox from "devextreme/ui/select_box";
import "devextreme/ui/tag_box";
import { template } from "handlebars";

import { IBaseComponent } from "../../../../../../../libs/core/components/base-component.abstract";
import { EnumDataType, EnumStatus } from "../../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../../libs/core/helpers/utils";
import { OGLayerModel } from "../../../../../../../libs/core/models/layer.model";

class ThietLapNguonSoLieuView implements IBaseComponent {
    formGrid: dxDataGrid;
    formStore: CustomStore;
    importGrid: dxDataGrid;
    importPopup: dxPopup;
    importUploader: dxFileUploader;
    layerStore: CustomStore;
    newForm: dxForm;
    newFormFieldGrid: dxDataGrid;
    newFormPopup: dxPopup;
    schema: CustomStore;
    sourceStore: ArrayStore;
    tableSchemaStore: CustomStore;
    tableViewsContainer: JQuery<HTMLElement>;
    constructor(container: JQuery<HTMLElement>) {
        this.tableViewsContainer = container;
        this.onInit();
    }

    private initFormGrid(): void {
        this.formGrid = $("<div />").appendTo(this.tableViewsContainer).dxDataGrid({
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
                allowEditing: false,
                caption: "Thao tác",
                cellTemplate: (container, options) => {
                    $("<div>").appendTo(container).dxToolbar({
                        items: [{
                            location: "center",
                            options: {
                                icon: "icon icon-edit-2",
                                onClick: () => {
                                    $.get("/api/form?id=" + options.data.id).done(xhr => {
                                        if (xhr.status === EnumStatus.OK) {
                                            const data = xhr.data;
                                            this.newForm.option("formData", data);
                                            this.newForm.option("formData.table_schema", data.tableInfo.table_schema);
                                            this.newForm.option("formData.layer_id", data.layer.id);
                                            this.newFormFieldGrid.selectRows(data.form_fields.map(item => item.table_column_id), false);
                                            this.newFormPopup.show();
                                        }
                                    });
                                },
                                type: "success"
                            },
                            widget: "dxButton"
                        }, {
                            location: "center",
                            options: {
                                icon: "icon icon-trash",
                                onClick: () => {
                                    OGUtils.confirm("Xóa biểu mẫu này?").then(value => {
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
                        },
                            // {
                            //     location: "center",
                            //     options: {
                            //         displayExpr: "value",
                            //         icon: "icon icon-export-1",
                            //         items: [{
                            //             id: "csv",
                            //             value: "CSV"
                            //         }, {
                            //             id: "xlsx",
                            //             value: "Excel"
                            //         }, {
                            //             id: "geodatabase",
                            //             value: "Geodatabase"
                            //         }, {
                            //             id: "shp",
                            //             value: "Shapefile"
                            //         }],
                            //         onItemClick: (e) => {
                            //             if (e.itemData) {
                            //                 let extension;
                            //                 if (e.itemData.id === "xlsx") {
                            //                     extension = ".xlsx";
                            //                 } else if (e.itemData.id === "csv") {
                            //                     extension = ".csv";
                            //                 } else if (e.itemData.id === "shp") {
                            //                     extension = ".zip";
                            //                 } else if (e.itemData.id === "geodatabase") {
                            //                     extension = ".gdb";
                            //                 }
                            //                 OGUtils.postDownload(`/api/form/export?id=${options.value}&f=${e.itemData.id}`, options.data.name + extension);
                            //             }
                            //         },
                            //         text: "Xuất biểu mẫu",
                            //         valueExpr: "id"
                            //     },
                            //     widget: "dxDropDownButton"
                            // }
                        ]
                    });
                },
                dataField: "id",
                width: 300,
            }],
            dataSource: {
                store: this.formStore
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
                e.toolbarOptions.items.unshift(
                    {
                        location: "before",
                        template: () => {
                            return "<h6>Thiết lập thông tin nguồn số liệu báo cáo</h6>";
                        }
                    },
                    {
                        location: "after",
                        options: {
                            onClick: (e) => {
                                this.newForm.option("formData", {});
                                this.newFormPopup.show();
                            },
                            text: "Tạo biểu mẫu"
                        },
                        widget: "dxButton"
                    },
                    {
                        location: "after",
                        options: {
                            icon: "refresh",
                            onClick: (e) => {
                                dataGrid.getDataSource().reload();
                            }
                        },
                        widget: "dxButton"
                    }
                );
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
        this.schema = undefined;
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
        this.sourceStore = new ArrayStore({
            data: [{
                id: 1,
                text: "Nguồn số liệu từ điều tra thống kê"
            }, {
                id: 2,
                text: "Nguồn số liệu từ cơ quan, đơn vị, tổ chức thuộc quản lý của ngành"
            }, {
                id: 3,
                text: "Nguồn dữ liệu từ cơ quan, đơn vị, tổ chức, cá nhân không thuộc quản lý"
            }],
            key: "id"
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
        this.formStore = new CustomStore({
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
                    url: "/api/form/listAll",
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
            }
        });
        this.newFormPopup = $("<div />").appendTo("body").dxPopup({
            closeOnOutsideClick: false,
            contentTemplate: (container) => {
                // container.css('padding', '0');
                this.newForm = $("<div />").appendTo(container).dxForm({
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
                            type: "required"
                        }]
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
                        dataField: "source_id",
                        editorOptions: {
                            dataSource: {
                                store: this.sourceStore,
                            },
                            displayExpr: "text",
                            valueExpr: "id"
                        },
                        editorType: "dxSelectBox",
                        label: {
                            text: "Nguồn dữ liệu"
                        },
                    }, {
                        dataField: "include_data",
                        editorType: "dxCheckBox",
                        label: {
                            text: "Bổ sung dữ liệu?"
                        },
                        visible: false,
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
                                                        id: this.newForm.option("formData").layer_id
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
                                    const layer = this.newForm.getEditor("layer_id").option("selectedItem") as OGLayerModel;
                                    const columns = this.newFormFieldGrid.getSelectedRowsData();
                                    if (columns.length > 0) {
                                        const data = this.newForm.option("formData");
                                        data.form_fields = [];
                                        data.layer_id = layer?.id || 0;
                                        data.table_id = layer?.table_info_id || 0;
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
                                                this.formGrid.getDataSource().reload();
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
                                                this.formGrid.getDataSource().reload();
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
            width: 700,
        }).dxPopup("instance");

        this.importPopup = $("<div />").appendTo("body").dxPopup({
            closeOnOutsideClick: false,
            contentTemplate: (container) => {
                $("<div />").appendTo(container).dxForm({
                    colCount: 2,
                    items: [{
                        template: (data, element) => {
                            this.importUploader = $("<div />").appendTo(element).dxFileUploader({
                                labelText: "Chọn File nhập liệu",
                                selectButtonText: "[Chọn ...]",
                                uploadMode: "useForm",
                            }).dxFileUploader("instance");
                        }
                    }, {
                        template: (data, element) => {
                            $("<div />").appendTo(element).dxButton({
                                onClick: () => {
                                    const data = new FormData();
                                    const files = this.importUploader.option("value");
                                    if (files.length === 0) {
                                        OGUtils.alert("Vui lòng chọn file cần nhập liệu", "Thông báo!");
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
                        colSpan: 2,
                        template: (data, element) => {
                            return "<hr style='margin: 5px 0;' />";
                        }
                    }, {
                        colSpan: 2,
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
            onOptionChanged: (e) => {

            },
            resizeEnabled: false,
            shading: true,
            showCloseButton: true,
            showTitle: true,
            title: "Nhập thông tin từ biểu mẫu",
            width: 450,
        }).dxPopup("instance");
    }

    onInit(): void {
        $(".tab-item-container").css({
            "background-color": "white"
        }).height(window.innerHeight - $("header").outerHeight());
        this.initLayout();
        this.initFormGrid();
    }
}
export { ThietLapNguonSoLieuView };