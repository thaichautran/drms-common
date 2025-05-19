import { OGMapUtils } from "@opengis/map";
import axios from "axios";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import "devextreme/ui/data_grid";
import dxDataGrid from "devextreme/ui/data_grid";
import dxForm from "devextreme/ui/form";
import dxMultiView from "devextreme/ui/multi_view";
import dxPopup from "devextreme/ui/popup";
import "devextreme/ui/select_box";
import dxSelectBox from "devextreme/ui/select_box";

import { IBaseComponent } from "../../../../../../../libs/core/components/base-component.abstract";
import { EnumStatus } from "../../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../../libs/core/helpers/utils";
import { OGTableSchemaModel } from "../../../../../../../libs/core/models/table.model";
import { TableSchemaService } from "../../../../../../../libs/core/services/table.service";


class TableSchemaView implements IBaseComponent {
    container: JQuery<HTMLElement>;
    createTableSchemaPopup: dxPopup;
    tableSchemaForm: dxForm;
    tableSchemaGrid: dxDataGrid;

    constructor(container: JQuery<HTMLElement>) {
        this.container = container;
        this.initLayout();
    }
    private initLayout(): void {
        this.inittableSchemaGrid(this.container);
    }
    private inittableSchemaGrid(container): void {
        this.createTableSchemaPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.tableSchemaForm = $("<div />").appendTo(container)
                    .dxForm({
                        formData: {
                        },
                        items: [{
                            dataField: "schema_name",
                            label: {
                                text: "Tên khung dữ liệu",
                            },
                            validationRules: [{
                                message: "Vui lòng nhập tên khung dữ liệu",
                                type: "required"
                            }]
                        }, {
                            dataField: "description",
                            label: {
                                text: "Mô tả",
                            },
                            validationRules: [{
                                message: "Vui lòng nhập mô tả",
                                type: "required"
                            }]
                        }, {
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
                                                    const validate = this.tableSchemaForm.validate();
                                                    if (validate && validate.brokenRules.length === 0) {
                                                        OGUtils.showLoading();
                                                        const data = this.tableSchemaForm.option("formData");
                                                        /*data.__RequestVerificationToken = token;*/
                                                        $.ajax({
                                                            contentType: "application/json",
                                                            data: JSON.stringify(data),
                                                            type: "post",
                                                            url: TableSchemaService.BASE_URL + "/create",
                                                        }).done(xhr => {
                                                            if (xhr.status === EnumStatus.OK) {
                                                                OGUtils.hideLoading();
                                                                if (xhr.status === EnumStatus.OK) {
                                                                    OGUtils.alert("Tạo mới thành công!").then(() => {
                                                                        this.tableSchemaGrid.refresh(true);
                                                                        this.tableSchemaForm.resetValues();
                                                                        this.createTableSchemaPopup.hide();
                                                                    });
                                                                }
                                                                else {
                                                                    if (xhr.errors && xhr.errors.length > 0) {
                                                                        OGUtils.alert(xhr.errors[0].message || "Tạo mới lớp khung dữ liệu thất bại!");
                                                                    } else {
                                                                        OGUtils.alert("Tạo mới lớp khung dữ liệu thất bại!");
                                                                    }
                                                                }
                                                            }
                                                        });
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
                                                    this.createTableSchemaPopup.hide();
                                                },
                                                stylingMode: "contained",
                                                text: "Hủy",
                                                type: "danger"
                                            },
                                            widget: "dxButton"
                                        }]
                                    });
                            }
                        }],
                        onContentReady: () => {

                        },
                    }).dxForm("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: "auto",
            hideOnOutsideClick: false,
            onOptionChanged: () => {

            },
            resizeEnabled: false,
            shading: true,
            showCloseButton: true,
            showTitle: true,
            title: "Tạo mới khung dữ liệu",
            width: 500,
        }).dxPopup("instance");

        this.tableSchemaGrid = $("<div />").appendTo(container)
            .dxDataGrid({
                allowColumnReordering: true,
                allowColumnResizing: true,
                columnChooser: {
                    enabled: true,
                    mode: "select"
                },
                columns: [{
                    alignment: "center",
                    caption: "STT",
                    cellTemplate: (container, options) => {
                        const pageIndex = this.tableSchemaGrid.pageIndex();
                        const pageSize = this.tableSchemaGrid.pageSize();
                        container.append(`${(pageSize * pageIndex) + options.row.rowIndex + 1}`);
                    },
                    dataField: null,
                    width: 50,
                }, {
                    caption: "Tên",
                    dataField: "schema_name",
                    width: 300
                }, {
                    caption: "Mô tả",
                    dataField: "description",
                }, {
                    alignment: "center",
                    allowEditing: false,
                    caption: "Thao tác",
                    cellTemplate: (container, options) => {
                        $("<div>").appendTo(container).dxToolbar({
                            items: [
                                {
                                    location: "center",
                                    options: {
                                        hint: "Chỉnh sửa",
                                        icon: "icon icon-edit-2",
                                        onClick: () => {
                                            this.tableSchemaGrid.editRow(options.rowIndex);
                                        },
                                        type: "success"
                                    },
                                    widget: "dxButton"
                                },
                                {
                                    location: "center",
                                    options: {
                                        hint: "Xóa",
                                        icon: "icon icon-trash",
                                        onClick: () => {
                                            OGUtils.confirm("Xóa khung dữ liệu này? Tất cả các lớp dữ liệu thuộc khung dữ liệu cũng bị xóa theo!").then(value => {
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
                            ]
                        });
                    },
                    dataField: "id",
                    width: 150,
                }
                ],
                dataSource: {
                    store: new CustomStore({
                        byKey: (key) => {
                            return TableSchemaService.get(key);
                        },
                        key: "schema_name",
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

                            TableSchemaService.list(args).then(result => {
                                if (result) {
                                    deferred.resolve(result.data);
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
                            return TableSchemaService.delete({ schema_name: key } as OGTableSchemaModel);
                        },
                        update: (key, values) => {
                            return TableSchemaService.update(values);
                        }
                    }),
                },
                editing: {
                    form: {
                        colCount: 1,
                        items: [{
                            dataField: "description",
                        },]
                    },
                    mode: "popup",
                    popup: {
                        height: "auto",
                        showTitle: true,
                        title: "Thông tin khung dữ liệu",
                        width: 300,
                    },
                    texts: {
                        cancelRowChanges: "Hủy",
                        saveRowChanges: "Lưu",
                    },
                    useIcons: false
                },
                errorRowEnabled: false,
                filterRow: {
                    visible: true,
                },
                groupPanel: {
                    allowColumnDragging: false,
                    emptyPanelText: "Kéo tiêu đề cột vào đây để nhóm theo cột đó",
                    visible: true
                },
                height: "100%",
                loadPanel: {
                    text: "Đang tải dữ liệu"
                },
                noDataText: "Không có dữ liệu",
                onRowUpdating: function (options) {
                    $.extend(options.newData, $.extend({}, options.oldData, options.newData));
                },
                onToolbarPreparing: (e) => {
                    const dataGrid = e.component;
                    e.toolbarOptions.items.unshift({
                        location: "after",
                        options: {
                            onClick: () => {
                                this.createTableSchemaPopup.show();
                                this.tableSchemaForm.resetValues();
                            },
                            text: "Thêm khung dữ liệu",
                            type: "default"
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
                searchPanel: { visible: true },
                selection: {
                    mode: "single",
                    showCheckBoxesMode: "none"
                },
                showBorders: true,
                showRowLines: true,
                width: "100%",
            }).dxDataGrid("instance");
    }

    onInit(): void {

    }
}

export { TableSchemaView };
