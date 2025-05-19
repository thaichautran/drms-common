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

import { IBaseComponent } from "../../../../../../../../libs/core/components/base-component.abstract";
import { EnumStatus } from "../../../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../../../libs/core/helpers/utils";
import { BaseLayerService } from "../../../../../../../../libs/core/services/base-layer.service";


class BaseLayerView implements IBaseComponent {
    baseLayerForm: dxForm;
    baseLayerGrid: dxDataGrid;
    container: JQuery<HTMLElement>;
    createBaseLayerPopup: dxPopup;

    constructor(container: JQuery<HTMLElement>) {
        this.container = container;
        this.initLayout();
    }
    private initBaseLayerGrid(container): void {
        this.createBaseLayerPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.baseLayerForm = $("<div />").appendTo(container)
                    .dxForm({
                        formData: {
                        },
                        items: [{
                            dataField: "name",
                            label: {
                                text: "Tên lớp bản đồ",
                            },
                            validationRules: [{
                                message: "Vui lòng nhập tên bản đồ",
                                type: "required"
                            }]
                        }, {
                            dataField: "visible",
                            editorType: "dxCheckBox",
                            label: {
                                text: "Hiển thị?",
                            },
                        }, {
                            dataField: "url",
                            label: {
                                text: "Đường dẫn",
                            },
                            validationRules: [{
                                message: "Vui lòng nhập đường dẫn",
                                type: "required"
                            }]
                        },
                        {
                            dataField: "type",
                            label: {
                                text: "Phân loại",
                            },
                            validationRules: [{
                                message: "Vui lòng loại bản đồ",
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
                                                    const validate = this.baseLayerForm.validate();
                                                    if (validate && validate.brokenRules.length === 0) {
                                                        OGUtils.showLoading();
                                                        const data = this.baseLayerForm.option("formData");
                                                        /*data.__RequestVerificationToken = token;*/
                                                        $.ajax({
                                                            contentType: "application/json",
                                                            data: JSON.stringify(data),
                                                            type: "post",
                                                            url: "/api/base-layer/createOrUpdate",
                                                        }).done(xhr => {
                                                            if (xhr.status === EnumStatus.OK) {
                                                                OGUtils.hideLoading();
                                                                if (xhr.status === EnumStatus.OK) {
                                                                    OGUtils.alert("Tạo mới thành công!").then(() => {
                                                                        this.baseLayerGrid.refresh(true);
                                                                        this.baseLayerForm.resetValues();
                                                                        this.createBaseLayerPopup.hide();
                                                                    });
                                                                }
                                                                else {
                                                                    if (xhr.errors && xhr.errors.length > 0) {
                                                                        OGUtils.alert(xhr.errors[0].message || "Tạo mới lớp nền bản đồ thất bại!");
                                                                    } else {
                                                                        OGUtils.alert("Tạo mới lớp nền bản đồ thất bại!");
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
                                                    this.createBaseLayerPopup.hide();
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
            showCloseButton: false,
            showTitle: true,
            title: "Tạo mới lớp bản đồ",
            width: 500,
        }).dxPopup("instance");

        this.baseLayerGrid = $("<div />").appendTo(container)
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
                        const pageIndex = this.baseLayerGrid.pageIndex();
                        const pageSize = this.baseLayerGrid.pageSize();
                        container.append(`${(pageSize * pageIndex) + options.row.rowIndex + 1}`);
                    },
                    dataField: "index",
                    width: 50,
                }, {
                    caption: "Thứ tự",
                    dataField: "order",
                }, {
                    caption: "Tên",
                    dataField: "name",
                    width: 300
                }, {
                    caption: "Hiển thị",
                    dataField: "visible",
                    dataType: "boolean",
                    width: 100,
                }, {
                    caption: "Địa chỉ đường dẫn",
                    dataField: "url",
                }, {
                    caption: "Loại bản đồ",
                    dataField: "type",
                    width: 150
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
                                            this.baseLayerGrid.editRow(options.rowIndex);
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
                                            OGUtils.confirm("Xóa lớp bản đồ này?").then(value => {
                                                if (value) {
                                                    options.component.getDataSource().store().remove(options.value).then(() => {
                                                        options.component.getDataSource().reload().then(() => {
                                                            OGUtils.alert("Xóa thành công!");
                                                        });
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
                            return BaseLayerService.get(key);
                        },
                        insert: (values) => {
                            return BaseLayerService.insert(values);
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

                            BaseLayerService.list(args).then(result => {
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
                            return BaseLayerService.delete({ id: key });
                        },
                        update: (key, values) => {
                            return BaseLayerService.insert(values);
                        }
                    }),
                },
                editing: {
                    form: {
                        colCount: 1,
                        items: [{
                            dataField: "name",
                        }, {
                            dataField: "visible",
                        }, {
                            dataField: "url",
                        }, {
                            dataField: "type",
                        }, {
                            dataField: "order",
                        }]
                    },
                    mode: "popup",
                    popup: {
                        height: "auto",
                        showTitle: true,
                        title: "Thông tin lớp bản đồ",
                        width: 500,
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
                                this.createBaseLayerPopup.show();
                                this.baseLayerForm.resetValues();
                            },
                            text: "Thêm lớp bản đồ",
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
    private initLayout(): void {
        this.initBaseLayerGrid(this.container);
    }

    onInit(): void {

    }
}

export { BaseLayerView };
