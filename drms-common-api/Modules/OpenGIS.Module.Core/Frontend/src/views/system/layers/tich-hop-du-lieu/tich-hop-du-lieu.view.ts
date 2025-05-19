import ArrayStore from "devextreme/data/array_store";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import dxDataGrid from "devextreme/ui/data_grid";
import "devextreme/ui/data_grid";
import "devextreme/ui/form";
import dxForm from "devextreme/ui/form";
import "devextreme/ui/form";
import dxPopup from "devextreme/ui/popup";
import "devextreme/ui/popup";
import "devextreme/ui/progress_bar";
import dxSelectBox from "devextreme/ui/select_box";
import "devextreme/ui/tag_box";
import moment from "moment";

import { IBaseComponent } from "../../../../../../../libs/core/components/base-component.abstract";
import { EnumStatus } from "../../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../../libs/core/helpers/utils";
import { AreaService } from "../../../../../../../libs/core/services/area.service";
import "./tich-hop-du-lieu.view.scss";
class TichHopDuLieuView implements IBaseComponent {
    container: JQuery<HTMLElement>;
    resultTable: dxDataGrid;
    syncForm: dxForm;

    constructor(container: JQuery<HTMLElement>) {
        this.container = container;
        this.onInit();

    }
    onInit(): void {
        $("<h6>Đồng bộ dữ liệu GPS</h6>").css("padding", "10px").appendTo(this.container);
        this.syncForm = $("<div />").appendTo(this.container).css("padding", "10px").dxForm({
            colCount: 4,
            items: [{
                dataField: "loai_congtrinh_id",
                editorOptions: {
                    dataSource: {
                        store: new ArrayStore({
                            data: [{
                                id: 1,
                                text: "Nhà ở"
                            }, {
                                id: 2,
                                text: "Nhà văn hóa"
                            }, {
                                id: 3,
                                text: "Trường học"
                            }, {
                                id: 4,
                                text: "Cơ sở y tế"
                            }, {
                                id: 5,
                                text: "Ủy ban nhân dân"
                            },],
                            key: "id"
                        })
                    },
                    displayExpr: "text",
                    maxDisplayedTags: 1,
                    multiline: false,
                    noDataText: "Không có dữ liệu",
                    onMultiTagPreparing: function (args) {
                        const selectedItemsLength = args.selectedItems.length,
                            totalCount = 1;

                        if (selectedItemsLength < totalCount) {
                            args.cancel = true;
                        } else {
                            args.text = "[" + selectedItemsLength + "] loại đã chọn";
                        }
                    },
                    placeholder: "[Tất cả]",
                    searchEnabled: true,
                    searchExpr: ["text"],
                    searchMode: "contains",
                    showDropDownButton: true,
                    showSelectionControls: true,
                    valueExpr: "id",
                },
                editorType: "dxTagBox",
                label: {
                    text: "Loại dữ liệu",
                },
                validationRules: [{
                    message: "Vui lòng chọn loại dữ liệu",
                    type: "required"
                }]
            }, {

                dataField: "province_code",
                editorOptions: {
                    dataSource: new DataSource({
                        key: "area_id",
                        store: new CustomStore({
                            load: async (loadOptions) => {
                                return await AreaService.provinces(loadOptions.searchValue);
                            },
                            // loadMode: "raw"
                        })
                    }),
                    deferRendering: false,
                    displayExpr: "name_vn",
                    noDataText: "Không có dữ liệu",
                    onValueChanged: () => {
                        const districtEditor = this.syncForm.getEditor("district_code");
                        if (districtEditor && districtEditor instanceof dxSelectBox) {
                            districtEditor.getDataSource().reload();
                            districtEditor.reset();
                        }
                        const communeEditor = this.syncForm.getEditor("commune_code");
                        if (communeEditor && communeEditor instanceof dxSelectBox) {
                            communeEditor.getDataSource().reload();
                            communeEditor.reset();
                        }
                    },
                    searchEnabled: true,
                    searchExpr: ["name_vn"],
                    searchMode: "contains",
                    showClearButton: true,
                    valueExpr: "area_id",
                },
                editorType: "dxSelectBox",
                label: {
                    text: "Tỉnh, thành phố",
                },
                validationRules: [{
                    message: "Vui lòng chọn tỉnh/thành phố",
                    type: "required"
                }]
            }, {
                // 
                dataField: "district_code",
                editorOptions: {
                    dataSource: new DataSource({
                        key: "area_id",
                        store: new CustomStore({
                            byKey: function (key) {
                                if (key) {
                                    return AreaService.get(key);
                                }
                                return key;
                            },
                            load: async (loadOptions) => {
                                if (this.syncForm.option("formData").province_code) {
                                    const province_code = this.syncForm.option("formData").province_code;
                                    return await AreaService.districts(province_code, loadOptions.searchValue);
                                }
                                else {
                                    return [];
                                }
                            },
                            // loadMode: "raw"
                        })
                    }),
                    displayExpr: "name_vn",
                    onValueChanged: () => {
                        const communeEditor = this.syncForm.getEditor("commune_code");
                        if (communeEditor && communeEditor instanceof dxSelectBox) {
                            communeEditor.getDataSource().reload();
                            communeEditor.reset();
                        }
                    },
                    searchEnabled: true,
                    searchExpr: ["name_vn"],
                    searchMode: "contains",
                    showClearButton: true,
                    valueExpr: "area_id",
                },
                editorType: "dxSelectBox",
                label: {
                    text: "Quận, huyện",
                },
                validationRules: [{
                    message: "Vui lòng chọn quận, huyện",
                    type: "required"
                }]
            }, {
                // 
                dataField: "commune_code",
                editorOptions: {
                    dataSource: new DataSource({
                        key: "area_id",
                        store: new CustomStore({
                            byKey: function (key) {
                                if (key) {
                                    return AreaService.get(key);
                                }
                                return key;
                            },
                            key: "area_id",
                            load: async (loadOptions) => {
                                if (this.syncForm.option("formData").district_code) {
                                    const district_code = this.syncForm.option("formData").district_code;
                                    return await AreaService.communes(district_code, undefined, loadOptions.searchValue);
                                }
                                else {
                                    return [];
                                }
                            },
                            // loadMode: "processed"
                        }),
                    }),
                    displayExpr: "name_vn",
                    searchEnabled: true,
                    searchExpr: ["name_vn"],
                    searchMode: "contains",
                    showClearButton: true,
                    valueExpr: "area_id",
                },
                editorType: "dxSelectBox",
                label: {
                    text: "Xã, phường",
                },
                validationRules: [{
                    message: "Vui lòng chọn xã, phường",
                    type: "required"
                }]
            }, {
                colSpan: 4,
                template: () => {
                    return "<hr style=\"margin: 5px 0;\" />";
                }
            }, {
                colSpan: 4,
                template: (itemData, itemElement) => {
                    $("<div />").appendTo(itemElement)
                        .dxToolbar({
                            items: [{
                                location: "center",
                                options: {
                                    onClick: () => {
                                        const validate = this.syncForm.validate();
                                        if (validate && validate.brokenRules.length === 0) {
                                            OGUtils.showLoading();
                                            const data = this.syncForm.option("formData");
                                            $.ajax({
                                                contentType: "application/json",
                                                data: JSON.stringify(data),
                                                type: "post",
                                                url: "/api/drms/data/sync",
                                            }).done(xhr => {
                                                OGUtils.hideLoading();
                                                if (xhr.status === EnumStatus.OK) {
                                                    OGUtils.alert("Đồng bộ thành công! " + xhr.data);
                                                }
                                                else {
                                                    if (xhr.errors && xhr.errors.length > 0) {
                                                        OGUtils.alert(xhr.errors[0].message || "Đồng bộ dữ liệu thất bại!");
                                                    } else {
                                                        OGUtils.alert("Đồng bộ dữ liệu thất bại!");
                                                    }
                                                }
                                            });
                                        }
                                    },
                                    stylingMode: "contained",
                                    text: "Đồng bộ",
                                    type: "default"
                                },
                                widget: "dxButton"
                            },]
                        });
                }
            }],
            labelLocation: "top",
            // labelMode: "static"
        }).dxForm("instance");

        // this.resultTable = $("<div />").appendTo(this.container).dxDataGrid({
        //     allowColumnReordering: true,
        //     allowColumnResizing: true,
        //     columns: [{
        //         alignment: "center",
        //         caption: "STT",
        //         cellTemplate: (container, options) => {
        //             const pageIndex = this.resultTable.pageIndex();
        //             const pageSize = this.resultTable.pageSize();
        //             container.append(`${(pageSize * pageIndex) + options.row.rowIndex + 1}`);
        //         },
        //         dataField: "index",
        //         width: 50,
        //     },
        //     {
        //         caption: "Tên",
        //         dataField: "ten",
        //     },
        //     {
        //         caption: "Địa chỉ",
        //         dataField: "dia_diem",
        //     },
        //     {
        //         caption: "Loại dữ liệu",
        //         dataField: "type",
        //     },
        //     ],
        //     dataSource: {
        //         store: new CustomStore({
        //             load: (loadOptions) => {
        //                 return [];
        //             },
        //         }),
        //     },
        //     errorRowEnabled: false,
        //     height: "100%",
        //     loadPanel: {
        //         text: "Đang tải dữ liệu"
        //     },
        //     noDataText: "Không có dữ liệu",
        //     paging: {
        //         enabled: false,
        //         pageSize: 50
        //     },
        //     scrolling: {
        //         showScrollbar: "always"
        //     },
        //     searchPanel: { visible: true },
        //     selection: {
        //         mode: "single",
        //         showCheckBoxesMode: "none"
        //     },
        //     showBorders: true,
        //     showRowLines: true,
        //     width: "100%",
        // }).dxDataGrid("instance");
    }
}

export { TichHopDuLieuView };