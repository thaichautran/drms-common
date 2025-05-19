import axios from "axios";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import "devextreme/ui/data_grid";
import dxDataGrid from "devextreme/ui/data_grid";
import "devextreme/ui/date_box";
import dxForm from "devextreme/ui/form";
import dxList from "devextreme/ui/list";
import dxPopup from "devextreme/ui/popup";
import "devextreme/ui/select_box";
import dxTabPanel from "devextreme/ui/tab_panel";
import "devextreme/ui/text_area";
import dxToolbar from "devextreme/ui/toolbar";
import dxTreeView from "devextreme/ui/tree_view";
import Handlebars from "handlebars";
import moment from "moment";

import { SwitchModuleWindowComponent } from "../../../../../../libs/core/components/switch-module-window/switch-module-window.component";
import { RazorView } from "../../../../../../libs/core/decorators/razor-view.decorator";
import { EnumDanhMucMaintenance, EnumDataType, EnumStatus } from "../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../libs/core/helpers/utils";
import { Layout } from "../../../../../../libs/core/layout";
import { OGThongTinTraoDoiModel } from "../../../../../../libs/core/models/kiem-tra/kiem-tra.model";
import { OGLayerModel } from "../../../../../../libs/core/models/layer.model";
import { OGAttributeInfoItem, OGMaintenanceFileModel, OGProcessExistModel, OGWorderAssetModel, OGWorderModel } from "../../../../../../libs/core/models/maintenance.model";
import { OGTableColumnModel } from "../../../../../../libs/core/models/table.model";
// import { SwitchModuleWindowComponent } from "../../../components/switch-module-window/switch-module-window.component";
import ChatItem from "../templates/baoduong_chat_item.hbs";
import DanhSachKiemTraTemp from "../templates/danhsach_congviec_kiemtra.hbs";
import PhieuKiemTraTemp from "../templates/phieu_kiemtra.hbs";
import SearchTemp from "../templates/search_temp.hbs";
import SendMessageTmp from "../templates/send_message.hbs";
import "./maintenance.view.scss";

const ChatItemFunc = Handlebars.compile(ChatItem);

interface MaintenanceIframeBindModel {
    result: OGWorderModel[],
    totalCount: number
}

@RazorView()
class MaintenanceView extends Layout {
    arguments: object;
    columnRightContainer: JQuery<HTMLElement>;
    deleteMaintenanceFileIds: OGMaintenanceFileModel[];
    deleteProcessExist: OGProcessExistModel[];
    fileInput: JQuery<HTMLElement>;
    files: OGMaintenanceFileModel[];
    layerInfo: OGLayerModel;
    maintenanceAssetDatasource: OGWorderAssetModel[];
    maintenanceAssetGrid: dxDataGrid;
    maintenanceAssetGridContainer: JQuery<HTMLElement>;
    maintenanceAssetInfo: dxDataGrid;
    maintenanceAssetInfoDataSource: OGAttributeInfoItem[];
    maintenanceAssetInfoPopup: dxPopup;
    maintenanceAssetPopup: dxPopup;
    maintenanceChatContainer: JQuery<HTMLElement>;
    maintenanceChatDatasource: OGThongTinTraoDoiModel[];
    maintenanceChatList: dxList;
    maintenanceFileInput: JQuery<HTMLElement>;
    maintenanceFiles: OGMaintenanceFileModel[];
    maintenanceFilesContainter: JQuery<HTMLElement>;
    maintenanceFilesGrid: dxDataGrid;
    maintenanceForm: dxForm;
    maintenanceFormContainer: JQuery<HTMLElement>;
    maintenanceFormToolbar: dxToolbar;
    maintenanceGrid: dxDataGrid;
    maintenanceGridContainer: JQuery<HTMLElement>;
    maintenanceIframe: JQuery<HTMLElement>;
    maintenanceItemIframe: JQuery<HTMLElement>;
    maintenancePopup: dxPopup;
    maintenanceProcessDatasource: OGProcessExistModel[];
    maintenanceProcessForm: dxForm;
    maintenanceProcessGrid: dxDataGrid;
    maintenanceProcessGridContainer: JQuery<HTMLElement>;
    maintenanceProcessPopup: dxPopup;
    maintenanceStore: CustomStore<OGWorderModel, number>;
    newMaintenanceChats: OGThongTinTraoDoiModel[];
    objTypeStore: CustomStore;
    organizationStore: CustomStore;
    schema: string;
    searchLayerTree: dxTreeView;
    searchLayerTreeContainer: JQuery<HTMLElement>;
    searchResultContainer: JQuery<HTMLElement>;
    searchTabs: dxTabPanel;
    searchThietBiResultsGrid: dxDataGrid;
    switchModule: SwitchModuleWindowComponent;
    toolbarFormContainer: JQuery<HTMLElement>;
    wKindStore: CustomStore;
    wTypeResultStore: CustomStore;
    wTypeStore: CustomStore;
    worderStatusStore: CustomStore;
    constructor() {
        super("child");
        $("#header").find(".header-title >span").html("Quản lý công việc kiểm tra");
        this.switchModule = new SwitchModuleWindowComponent(this.schema);
        this.maintenanceGridContainer = $("#maintenance-container");
        this.arguments = {};
        this.maintenanceStore = new CustomStore({
            byKey: (key) => {
                const deferred = $.Deferred();
                $.get("/api/maintenance/" + key).done(xhr => {
                    if (xhr && xhr.status === EnumStatus.OK) {
                        deferred.resolve(xhr.data);
                    }
                    deferred.resolve({});
                });
                return deferred;
            },
            insert: (values) => {
                values.name_en = values.name_vn;
                values.table_schema = this.schema;
                return $.ajax({
                    contentType: "application/json",
                    data: JSON.stringify(values),
                    error: (xhr) => {
                        OGUtils.alert(xhr["errors"][0].message, "Lỗi");
                    },
                    success: (xhr) => {
                        if (xhr.status == "OK") {
                            OGUtils.alert("Lưu công việc kiểm tra thành công");
                        } else {
                            OGUtils.alert(xhr.errors[0].message, "Lỗi");
                        }
                    },
                    type: "POST",
                    url: "/api/maintenance/save",
                });
            },
            key: "worder_id",
            load: (loadOptions) => {
                const deferred = $.Deferred();

                if (loadOptions.sort) {
                    this.arguments["orderby"] = loadOptions.sort[0].selector;
                    if (loadOptions.sort[0].desc)
                        this.arguments["orderby"] += " desc";
                }
                this.arguments["skip"] = loadOptions.skip ? loadOptions.skip : 0;
                this.arguments["take"] = loadOptions.take ? loadOptions.take : 15;
                if (this.arguments) {
                    $.ajax({
                        contentType: "application/json",
                        data: JSON.stringify(this.arguments),
                        dataType: "json",
                        error: () => {
                            deferred.reject("Data Loading Error");
                        },
                        success: (result) => {
                            if (result.status === EnumStatus.OK && result.data && result.data.length > 0) {
                                let counter = this.arguments["skip"] + 1;
                                result.data.forEach(x => {
                                    x.counter = counter++;
                                });
                                const data: MaintenanceIframeBindModel = {
                                    result: result.data,
                                    totalCount: result.data.length
                                };
                                this.bindMaintenanceIframe(data);
                                deferred.resolve({
                                    data: result.data, 
                                    totalCount: result.data.length
                                });
                            } else {
                                deferred.resolve({
                                    data: [], 
                                    totalCount: 0
                                });
                            }
                        },
                        type: "post",
                        url: "/api/maintenance/list",
                    });
                } else {
                    deferred.resolve({
                        data: [], 
                        totalCount: 0
                    });
                }
                return deferred.promise();
            },
            loadMode: "raw",
            remove: (key) => {
                return $.ajax({
                    data: { worder_id: key },
                    error: (xhr) => {
                        OGUtils.alert(xhr["errors"][0].message, "Lỗi");
                    },
                    success: (xhr) => {
                        if (xhr.status == "OK") {
                            OGUtils.alert("Xóa công việc kiểm tra thành công!");
                        } else {
                            OGUtils.alert(xhr.errors[0].message, "Lỗi");
                        }
                    },
                    type: "POST",
                    url: "/api/maintenance/delete",
                });
            },
            update: (key, values) => {
                return $.ajax({
                    contentType: "application/json",
                    data: JSON.stringify(values),
                    error: (xhr) => {
                        OGUtils.alert(xhr["errors"][0].message, "Lỗi");
                    },
                    success: (xhr) => {
                        if (xhr.status == "OK") {
                            OGUtils.alert("Lưu công việc kiểm tra thành công");
                        } else {
                            OGUtils.alert(xhr.errors[0].message, "Lỗi");
                        }
                    },
                    type: "POST",
                    url: "/api/maintenance/save",
                });
            }
        });
        this.organizationStore = new CustomStore({
            key: "id",
            load: () => {
                const deferred = $.Deferred();
                axios.get("/api/maintenance/danh-muc/" + EnumDanhMucMaintenance.DONVI).then(result => {
                    if (result.data.status === EnumStatus.OK && result.data.data && result.data.data.length > 0) {
                        deferred.resolve(result.data.data,);
                    } else {
                        deferred.resolve([]);
                    }
                });
                return deferred.promise();
            },
            loadMode: "raw"
        });
        this.objTypeStore = new CustomStore({
            key: "id",
            load: () => {
                const deferred = $.Deferred();
                axios.get("/api/maintenance/danh-muc/" + EnumDanhMucMaintenance.LOAICONGVIEC).then(result => {
                    if (result.data.status === EnumStatus.OK && result.data.data && result.data.data.length > 0) {
                        deferred.resolve(result.data.data,);
                    } else {
                        deferred.resolve([]);
                    }
                });
                return deferred.promise();
            },
            loadMode: "raw"
        });
        this.wTypeStore = new CustomStore({
            key: "id",
            load: () => {
                const deferred = $.Deferred();
                axios.get("/api/maintenance/danh-muc/" + EnumDanhMucMaintenance.KIEUCONGVIEC).then(result => {
                    if (result.data.status === EnumStatus.OK && result.data.data && result.data.data.length > 0) {
                        deferred.resolve(result.data.data,);
                    } else {
                        deferred.resolve([]);
                    }
                });
                return deferred.promise();
            },
            loadMode: "raw"
        });
        this.worderStatusStore = new CustomStore({
            key: "id",
            load: () => {
                const deferred = $.Deferred();
                axios.get("/api/maintenance/danh-muc/" + EnumDanhMucMaintenance.TRANGTHAICONGVIEC).then(result => {
                    if (result.data.status === EnumStatus.OK && result.data.data && result.data.data.length > 0) {
                        deferred.resolve(result.data.data,);
                    } else {
                        deferred.resolve([]);
                    }
                });
                return deferred.promise();
            },
            loadMode: "raw"
        });
        this.wKindStore = new CustomStore({
            key: "id",
            load: () => {
                const deferred = $.Deferred();
                axios.get("/api/maintenance/danh-muc/" + EnumDanhMucMaintenance.HINHTHUCKIEMTRA).then(result => {
                    if (result.data.status === EnumStatus.OK && result.data.data && result.data.data.length > 0) {
                        deferred.resolve(result.data.data,);
                    } else {
                        deferred.resolve([]);
                    }
                });
                return deferred.promise();
            },
            loadMode: "raw"
        });
        this.wTypeResultStore = new CustomStore({
            key: "id",
            load: () => {
                const deferred = $.Deferred();
                axios.get("/api/maintenance/danh-muc/" + EnumDanhMucMaintenance.DANHMUCKETQUA).then(result => {
                    if (result.data.status === EnumStatus.OK && result.data.data && result.data.data.length > 0) {
                        deferred.resolve(result.data.data,);
                    } else {
                        deferred.resolve([]);
                    }
                });
                return deferred.promise();
            },
            loadMode: "raw"
        });
    }
    private _initMaintenance(): void {
        const self = this;
        //Popup thêm kế hoạch kiểm tra
        this.maintenanceAssetDatasource = [];
        this.deleteProcessExist = [];
        this.maintenanceProcessDatasource = [];
        this.maintenanceFiles = [];
        this.deleteMaintenanceFileIds = [];
        this.maintenanceChatDatasource = [];
        this.maintenancePopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                container.css("padding", "10px");
                const row = $("<div />").appendTo(container).height("100%");
                this.maintenanceFormContainer = $("<div />").appendTo(row).height("100%").css({
                    "float": "left",
                    "overflow-y": "auto",
                    "padding-right": "10px",
                    "width": "600px"
                });
                this.maintenanceFormContainer.append("<p class=\"maintenance-title\">Thông tin chung</p>");

                this.columnRightContainer = $("<div />").appendTo(row).css({
                    "border-left": "1px solid #ddd",
                    "height": "calc(100% - 50px)",
                    "margin-left": "600px",
                    "overflow-y": "auto",
                    "padding-left": "5px"
                });

                this.columnRightContainer.append("<p class=\"maintenance-title\">Danh sách các thiết bị công trình cần kiểm tra</>");
                this.maintenanceAssetGridContainer = $("<div />").appendTo(this.columnRightContainer).height("300px");
                this.columnRightContainer.append("<p class=\"maintenance-title\">Danh sách các tồn tại cần xử lý</p>");
                this.maintenanceProcessGridContainer = $("<div />").appendTo(this.columnRightContainer).height("300px");

                this.columnRightContainer.append("<p class=\"maintenance-title\">Danh sách tệp đính kèm</p>");
                this.maintenanceFilesContainter = $("<div />").appendTo(this.columnRightContainer).height("300px");

                this.columnRightContainer.append("<p class=\"maintenance-title\">Nội dung trao đổi</p>");
                this.maintenanceChatContainer = $("<div />").css("padding", "10px").height("300px").css("border", "1px solid #ddd").appendTo(this.columnRightContainer);

                this.toolbarFormContainer = $("<div />").appendTo(row).css("padding", "10px").css("float", "right");
                //Form thông tin chung
                this.maintenanceForm = $("<form />").appendTo(this.maintenanceFormContainer)
                    .dxForm({
                        colCount: 2,
                        height: "100%",
                        items: [{
                            dataField: "worder_id",
                            visible: false
                        }, {
                            dataField: "org_id",
                            editorOptions: {
                                dataSource: this.organizationStore,
                                displayExpr: "mo_ta",
                                height: 30,
                                onContentReady: () => {
                                    $(".dx-list-item-content").each(function () {
                                        const $ele = $(this);
                                        if (this.offsetWidth < this.scrollWidth) {
                                            $ele.attr("title", $ele.text());
                                        }
                                    });
                                },
                                placeholder: "[Chọn đơn vị quản lý...]",
                                searchEnabled: true,
                                valueExpr: "id",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Đơn vị quản lý",
                            },
                            validationRules: [{
                                message: "Vui lòng chọn đơn vị quản lý",
                                type: "required"
                            }]
                        }, {
                            dataField: "worg_id",
                            editorOptions: {
                                dataSource: self.organizationStore,
                                displayExpr: "mo_ta",
                                height: 30,
                                onContentReady: () => {
                                    $(".dx-list-item-content").each(function () {
                                        const $ele = $(this);
                                        if (this.offsetWidth < this.scrollWidth) {
                                            $ele.attr("title", $ele.text());
                                        }
                                    });
                                },
                                onSelectionChanged: () => {
                                },
                                placeholder: "[Chọn đơn vị thực hiện...]",
                                searchEnabled: true,
                                value: "",
                                valueExpr: "id",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Đơn vị thực hiện",
                            },
                        }, {
                            dataField: "obj_type_id",
                            editorOptions: {
                                dataSource: this.objTypeStore,
                                displayExpr: "mo_ta",
                                height: 30,
                                onContentReady: () => {
                                    $(".dx-list-item-content").each(function () {
                                        const $ele = $(this);
                                        if (this.offsetWidth < this.scrollWidth) {
                                            $ele.attr("title", $ele.text());
                                        }
                                    });
                                },
                                placeholder: "[Chọn loại thực hiện...]",
                                searchEnabled: true,
                                valueExpr: "id",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Loại thực hiện",
                            },
                        }, {
                            dataField: "wtype_id",
                            editorOptions: {
                                dataSource: self.wTypeStore,
                                displayExpr: "mo_ta",
                                height: 30,
                                onChange: () => {

                                },
                                onContentReady: () => {
                                    $(".dx-list-item-content").each(function () {
                                        const $ele = $(this);
                                        if (this.offsetWidth < this.scrollWidth) {
                                            $ele.attr("title", $ele.text());
                                        }
                                    });
                                },
                                placeholder: "[Chọn kiểu công việc...]",
                                searchEnabled: true,
                                value: "",
                                valueExpr: "id",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Kiểu công việc",
                            },
                        }, {
                            dataField: "wkind_id",
                            editorOptions: {
                                dataSource: self.wKindStore,
                                displayExpr: "mo_ta",
                                height: 30,
                                onChange: () => {

                                },
                                onContentReady: () => {
                                    $(".dx-list-item-content").each(function () {
                                        const $ele = $(this);
                                        if (this.offsetWidth < this.scrollWidth) {
                                            $ele.attr("title", $ele.text());
                                        }
                                    });
                                },
                                placeholder: "[Chọn hình thức...]",
                                searchEnabled: true,
                                value: "",
                                valueExpr: "id",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Hình thức kiểm tra",
                            },
                        }, {
                            dataField: "wtype_result_id",
                            editorOptions: {
                                dataSource: self.wTypeResultStore,
                                displayExpr: "mo_ta",
                                height: 30,
                                onChange: () => {

                                },
                                onContentReady: () => {
                                    $(".dx-list-item-content").each(function () {
                                        const $ele = $(this);
                                        if (this.offsetWidth < this.scrollWidth) {
                                            $ele.attr("title", $ele.text());
                                        }
                                    });
                                },
                                placeholder: "[Chọn kết quả...]",
                                searchEnabled: true,
                                value: "",
                                valueExpr: "id",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Kết quả thực hiện",
                            },
                        }, {
                            dataField: "fc_start_date",
                            editorOptions: {
                                dateSerializationFormat: "yyyy-MM-ddTHH:mm:ss",
                                displayFormat: "dd/MM/yyyy",
                                height: 30,
                                invalidDateMessage: "Vui lòng nhập đúng định dạng: dd/MM/yyyy",
                                placeholder: "Ngày bắt đầu dự báo",
                                showClearButton: true,
                                type: "date",
                            },
                            editorType: "dxDateBox",
                            label: {
                                text: "Ngày bắt đầu dự báo",
                            },
                            validationRules: [{
                                message: "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc",
                                type: "custom",
                                validationCallback: function (e) {
                                    const startDate = e.value;
                                    const endDate = self.maintenanceForm.getEditor("fc_finish_date").option("value");
                                    if (startDate && endDate) {
                                        if (new Date(startDate) <= new Date(endDate)) {
                                            return true;
                                        } else {
                                            return false;
                                        }
                                    } else {
                                        return true;
                                    }
                                }
                            }]
                        }, {
                            dataField: "fc_finish_date",
                            editorOptions: {
                                dateSerializationFormat: "yyyy-MM-ddTHH:mm:ss",
                                displayFormat: "dd/MM/yyyy",
                                height: 30,
                                invalidDateMessage: "Vui lòng nhập đúng định dạng: dd/MM/yyyy",
                                placeholder: "Ngày kết thúc dự báo",
                                showClearButton: true,
                                type: "date",
                            },
                            editorType: "dxDateBox",
                            label: {
                                text: "Ngày kết thúc dự báo",
                            },
                            validationRules: [{
                                message: "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu",
                                type: "custom",
                                validationCallback: function (e) {
                                    const startDate = self.maintenanceForm.getEditor("fc_start_date").option("value");
                                    const endDate = e.value;
                                    if (startDate && endDate) {
                                        if (new Date(startDate) <= new Date(endDate)) {
                                            return true;
                                        } else {
                                            return false;
                                        }
                                    } else {
                                        return true;
                                    }
                                }
                            }]
                        }, {
                            dataField: "plan_start_date",
                            editorOptions: {
                                dateSerializationFormat: "yyyy-MM-ddTHH:mm:ss",
                                displayFormat: "dd/MM/yyyy",
                                height: 30,
                                invalidDateMessage: "Vui lòng nhập đúng định dạng: dd/MM/yyyy",
                                placeholder: "Ngày bắt đầu kế hoạch",
                                showClearButton: true,
                                type: "date",
                            },
                            editorType: "dxDateBox",
                            label: {
                                text: "Ngày bắt đầu kế hoạch",
                            },
                            validationRules: [{
                                message: "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc",
                                type: "custom",
                                validationCallback: function (e) {
                                    const startDate = e.value;
                                    const endDate = self.maintenanceForm.getEditor("plan_finish_date").option("value");
                                    if (startDate && endDate) {
                                        if (new Date(startDate) <= new Date(endDate)) {
                                            return true;
                                        } else {
                                            return false;
                                        }
                                    } else {
                                        return true;
                                    }
                                }
                            }]
                        }, {
                            dataField: "plan_finish_date",
                            editorOptions: {
                                dateSerializationFormat: "yyyy-MM-ddTHH:mm:ss",
                                displayFormat: "dd/MM/yyyy",
                                height: 30,
                                invalidDateMessage: "Vui lòng nhập đúng định dạng: dd/MM/yyyy",
                                placeholder: "Ngày kết thúc kế hoạch",
                                showClearButton: true,
                                type: "date",
                            },
                            editorType: "dxDateBox",
                            label: {
                                text: "Ngày kết thúc kế hoạch",
                            },
                            validationRules: [{
                                message: "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu",
                                type: "custom",
                                validationCallback: function (e) {
                                    const startDate = self.maintenanceForm.getEditor("plan_start_date").option("value");
                                    const endDate = e.value;
                                    if (startDate && endDate) {
                                        if (new Date(startDate) <= new Date(endDate)) {
                                            return true;
                                        } else {
                                            return false;
                                        }
                                    } else {
                                        return true;
                                    }
                                }
                            }]
                        }, {
                            dataField: "actual_start_date",
                            editorOptions: {
                                dateSerializationFormat: "yyyy-MM-ddTHH:mm:ss",
                                displayFormat: "dd/MM/yyyy",
                                height: 30,
                                invalidDateMessage: "Vui lòng nhập đúng định dạng: dd/MM/yyyy",
                                placeholder: "Ngày bắt đầu thực hiện",
                                showClearButton: true,
                                type: "date",
                            },
                            editorType: "dxDateBox",
                            label: {
                                text: "Ngày bắt đầu thực hiện",
                            },
                            validationRules: [{
                                message: "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc",
                                type: "custom",
                                validationCallback: function (e) {
                                    const startDate = e.value;
                                    const endDate = self.maintenanceForm.getEditor("actual_finish_date").option("value");
                                    if (startDate && endDate) {
                                        if (new Date(startDate) <= new Date(endDate)) {
                                            return true;
                                        } else {
                                            return false;
                                        }
                                    } else {
                                        return true;
                                    }
                                }
                            }]
                        }, {
                            dataField: "actual_finish_date",
                            editorOptions: {
                                dateSerializationFormat: "yyyy-MM-ddTHH:mm:ss",
                                displayFormat: "dd/MM/yyyy",
                                height: 30,
                                invalidDateMessage: "Vui lòng nhập đúng định dạng: dd/MM/yyyy",
                                placeholder: "Ngày kết thúc thực hiện",
                                showClearButton: true,
                                type: "date",
                            },
                            editorType: "dxDateBox",
                            label: {
                                text: "Ngày kết thúc thực hiện",
                            },
                            validationRules: [{
                                message: "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu",
                                type: "custom",
                                validationCallback: function (e) {
                                    const startDate = self.maintenanceForm.getEditor("actual_start_date").option("value");
                                    const endDate = e.value;
                                    if (startDate && endDate) {
                                        if (new Date(startDate) <= new Date(endDate)) {
                                            return true;
                                        } else {
                                            return false;
                                        }
                                    } else {
                                        return true;
                                    }
                                }
                            }]
                        }, {
                            dataField: "wstatus_id_all",
                            editorOptions: {
                                dataSource: this.worderStatusStore,
                                displayExpr: "mo_ta",
                                height: 30,
                                onContentReady: () => {
                                    $(".dx-list-item-content").each(function () {
                                        const $ele = $(this);
                                        if (this.offsetWidth < this.scrollWidth) {
                                            $ele.attr("title", $ele.text());
                                        }
                                    });
                                },
                                onSelectionChanged: () => {
                                },
                                placeholder: "[Chọn trạng thái...]",
                                searchEnabled: true,
                                value: "",
                                valueExpr: "id",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Trạng thái",
                            },
                            validationRules: [{
                                message: "Vui lòng chọn trạng thái công việc",
                                type: "required"
                            }]
                        }, {
                            dataField: "wdesc",
                            editorOptions: {
                                placeholder: "Mô tả",
                                showClearButton: true,
                            },
                            editorType: "dxTextArea",
                            label: {
                                text: "Mô tả",
                            },
                        }, {
                            colSpan: 2,
                            dataField: "wdesc_info",
                            editorOptions: {
                                placeholder: "Mô tả tóm tắt công việc",
                                showClearButton: true,
                            },
                            editorType: "dxTextArea",
                            label: {
                                text: "Mô tả tóm tắt công việc",
                            },
                        }, {
                            colSpan: 2,
                            dataField: "wdesc_more",
                            editorOptions: {
                                placeholder: "Mô tả chi tiết công việc",
                                showClearButton: true,
                            },
                            editorType: "dxTextArea",
                            label: {
                                text: "Mô tả chi tiết công việc",
                            },
                        }, {
                            colSpan: 2,
                            dataField: "a_result_sum",
                            editorOptions: {
                                placeholder: "Mô tả chi tiết kết quả thực hiện công việc",
                                showClearButton: true,
                            },
                            editorType: "dxTextArea",
                            label: {
                                text: "Mô tả chi tiết kết quả thực hiện công việc",
                            },
                        },],
                        labelLocation: "top",
                        scrollingEnabled: false,
                    }).dxForm("instance");
                //Grid thiết bị kiểm tra
                this.maintenanceAssetGrid = $("<div />").appendTo(this.maintenanceAssetGridContainer).dxDataGrid({
                    allowColumnReordering: true,
                    allowColumnResizing: true,
                    columns: [{
                        alignment: "center",
                        caption: "STT",
                        cellTemplate: (container, options) => {
                            const pageIndex = this.maintenanceAssetGrid.pageIndex();
                            const pageSize = this.maintenanceAssetGrid.pageSize();
                            container.append((pageSize * pageIndex) + options.row["dataIndex"] + 1);
                        },
                        dataField: "index",
                        width: 50,
                    }, {
                        dataField: "id",
                        visible: false,
                        width: 50,
                    }, {
                        dataField: "layer_id",
                        visible: false,
                    }, {
                        caption: "Lớp dữ liệu",
                        dataField: "layer_name",
                        groupIndex: 0,
                    }, {
                        caption: "Thiết bị, công trình",
                        dataField: "asset_name"
                    }, {
                        alignment: "center",
                        allowEditing: false,
                        caption: "Thao tác",
                        cellTemplate: (container, options) => {
                            $("<div>").appendTo(container).dxToolbar({
                                items: [{
                                    location: "center",
                                    options: {
                                        hint: "Xóa thiết bị, công trình khỏi danh sách kiểm tra",
                                        icon: "icon icon-trash",
                                        onClick: () => {
                                            OGUtils.confirm("Bạn muốn thiết bị, công trình này khỏi danh sách kiểm tra?").then(value => {
                                                if (value) {
                                                    options.component.getDataSource().store().remove(options.data["id"]).then(() => {
                                                        options.component.getDataSource().reload();
                                                    });
                                                }
                                            });
                                        },
                                        type: "danger"
                                    },
                                    widget: "dxButton"
                                }]
                            });
                        },
                        dataField: "id",
                        width: 100,
                    }],
                    dataSource: self.maintenanceAssetDatasource,
                    errorRowEnabled: false,
                    height: "270px",
                    loadPanel: {
                        text: "Đang tải dữ liệu"
                    },
                    noDataText: "Không có dữ liệu",
                    onContentReady: (e) => {
                        e.element.find(".dx-datagrid-header-panel").css("padding-top", "0").css("margin", "0");
                    },
                    onRowUpdating: function (options) {
                        $.extend(options.newData, $.extend({}, options.oldData, options.newData));
                    },
                    onToolbarPreparing: (e) => {

                        e.toolbarOptions.items.unshift({
                            location: "after",
                            options: {
                                hint: "Thêm thiết bị công trình",
                                icon: "icon icon-add",
                                onClick: () => {
                                    this.maintenanceAssetPopup.show();
                                },
                                type: "success"
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
                        visible: true,
                        /*displayMode: 'compact'*/
                    },
                    paging: {
                        enabled: true,
                        pageSize: 15
                    },
                    scrolling: {
                        showScrollbar: "always"
                    },
                    selection: {
                        mode: "single"
                    },
                    showBorders: true,
                    width: "100%",
                }).dxDataGrid("instance");
                // Grid tồn tại
                this.maintenanceProcessGrid = $("<div />").appendTo(this.maintenanceProcessGridContainer).dxDataGrid({
                    allowColumnReordering: true,
                    allowColumnResizing: false,
                    columns: [{
                        alignment: "center",
                        caption: "STT",
                        cellTemplate: (container, options) => {
                            const pageIndex = this.maintenanceProcessGrid.pageIndex();
                            const pageSize = this.maintenanceProcessGrid.pageSize();
                            container.append((pageSize * pageIndex) + options.row["dataIndex"] + 1);
                        },
                        dataField: "index",
                        width: 50,
                    }, {
                        dataField: "process_exist_id",
                        visible: false,
                    }, {
                        caption: "Loại thực hiện",
                        dataField: "obj_type_id",
                        lookup: {
                            dataSource: {
                                store: this.objTypeStore,
                            },
                            displayExpr: "mo_ta",
                            // placeholder: "[Chọn ...]",
                            valueExpr: "id",
                        },
                        visible: false
                    }, {
                        caption: "Tồn tại",
                        dataField: "solution_exist",
                    }, {
                        caption: "Ngày phát hiện",
                        dataField: "date_solution_exist",
                        dataType: "date",
                        width: 120,
                    }, {
                        caption: "Trạng thái",
                        dataField: "status_id",
                        lookup: {
                            dataSource: [
                                { id: 0, text: "Chưa xử lý" },
                                { id: 1, text: "Đã xử lý" },
                                { id: 2, text: "Không xử lý" },
                            ],
                            displayExpr: "text",
                            // placeholder: "[Chọn ...]",
                            valueExpr: "id",
                        },
                        width: 100
                    }, {
                        alignment: "center",
                        allowEditing: false,
                        caption: "Thao tác",
                        cellTemplate: (container, options) => {
                            $("<div>").appendTo(container).dxToolbar({
                                items: [{
                                    location: "center",
                                    options: {
                                        hint: "Chỉnh sửa",
                                        icon: "icon icon-edit-2",
                                        onClick: () => {
                                            this.maintenanceProcessGrid.editRow(options.rowIndex);
                                        },
                                        type: "success"
                                    },
                                    widget: "dxButton"
                                }, {
                                    location: "center",
                                    options: {
                                        hint: "Xóa",
                                        icon: "icon icon-trash",
                                        onClick: () => {
                                            OGUtils.confirm("Bạn muốn xóa tồn tại này?").then(value => {
                                                if (value) {
                                                    options.component.getDataSource().store().remove(options.data.id).then(() => {
                                                        self.deleteProcessExist.push(options.data);
                                                        self.maintenanceProcessDatasource = options.component.getDataSource().items();
                                                        options.component.getDataSource().reload();
                                                    });
                                                }
                                            });
                                        },
                                        type: "danger"
                                    },
                                    widget: "dxButton"
                                }]
                            });
                        },
                        dataField: "id",
                        width: 100,
                    }],
                    dataSource: self.maintenanceProcessDatasource,
                    editing: {
                        form: {
                            colCount: 1,
                            items: [{
                                dataField: "obj_type_id"
                            }, {
                                dataField: "date_solution_exist",
                            }, {
                                dataField: "status_id",
                            }, {
                                dataField: "solution_exist",
                            },]
                        },
                        mode: "popup",
                        popup: {
                            height: "auto",
                            showTitle: true,
                            title: "Thông tin tồn tại của công việc kiểm tra",
                            width: "500"
                        },
                        texts: {
                            cancelRowChanges: "Hủy",
                            saveRowChanges: "Lưu",
                        },
                        useIcons: false
                    },
                    errorRowEnabled: false,
                    height: "270px",
                    loadPanel: {
                        text: "Đang tải dữ liệu"
                    },
                    noDataText: "Không có dữ liệu",
                    onContentReady: (e) => {
                        e.element.find(".dx-datagrid-header-panel").css("padding-top", "0").css("margin", "0");
                    },
                    onRowUpdating: function (options) {
                        $.extend(options.newData, $.extend({}, options.oldData, options.newData));
                    },
                    onToolbarPreparing: (e) => {
                        e.toolbarOptions.items.unshift({
                            location: "after",
                            options: {
                                hint: "Thêm tồn tại cần xử lý",
                                icon: "icon icon-add",
                                onClick: () => {
                                    self.maintenanceProcessPopup.show();
                                },
                                type: "success"
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
                        visible: true,
                        /*displayMode: 'compact'*/
                    },
                    paging: {
                        enabled: true,
                        pageSize: 15
                    },
                    scrolling: {
                        showScrollbar: "always"
                    },
                    selection: {
                        mode: "single"
                    },
                    showBorders: true,
                    width: "100%",
                }).dxDataGrid("instance");
                // Grid tệp đính kèm
                this.maintenanceFilesGrid = $("<div />").appendTo(this.maintenanceFilesContainter).dxDataGrid({
                    allowColumnResizing: false,
                    columns: [{
                        alignment: "center",
                        caption: "STT",
                        cellTemplate: (container, options) => {
                            const pageIndex = this.maintenanceFilesGrid.pageIndex();
                            const pageSize = this.maintenanceFilesGrid.pageSize();
                            container.append((pageSize * pageIndex) + options.row["dataIndex"] + 1);
                        },
                        dataField: "index",
                        visible: false,
                        width: 50,
                    }, {
                        dataField: "id",
                        visible: false,
                    }, {
                        caption: "Tên file",
                        cellTemplate: (container, options) => {
                            container.append(`<a href = "${self.config.CDNUrl}${options.data.url}" download="${options.data.file_name}">${options.data.file_name}</a>`);
                        },
                        dataField: "file_name"
                    }, {
                        alignment: "center",
                        allowEditing: false,
                        caption: "Thao tác",
                        cellTemplate: (container, options) => {
                            $("<div>").appendTo(container).dxToolbar({
                                items: [{
                                    location: "center",
                                    options: {
                                        hint: "Xóa tệp đính kèm",
                                        icon: "icon icon-trash",
                                        onClick: () => {
                                            OGUtils.confirm("Bạn muốn xóa tệp đính kèm này?").then(value => {
                                                if (value) {
                                                    options.component.getDataSource().store().remove(options.data.id).then(() => {
                                                        if (options.data.id > 0) {
                                                            self.deleteMaintenanceFileIds.push(options.data.id);
                                                        }
                                                        self.maintenanceFiles = options.component.getDataSource().items();
                                                        options.component.getDataSource().reload();
                                                    });
                                                }
                                            });
                                        },
                                        type: "danger"
                                    },
                                    widget: "dxButton"
                                }]
                            });
                        },
                        dataField: "id",
                        width: 100,
                    }],
                    dataSource: self.maintenanceFiles,
                    errorRowEnabled: false,
                    height: "270px",
                    loadPanel: {
                        text: "Đang tải dữ liệu"
                    },
                    noDataText: "Không có dữ liệu",
                    onContentReady: (e) => {
                        e.element.find(".dx-datagrid-header-panel").css("padding-top", "0").css("margin", "0");
                    },
                    onRowUpdating: function (options) {
                        $.extend(options.newData, $.extend({}, options.oldData, options.newData));
                    },
                    onToolbarPreparing: (e) => {
                        e.toolbarOptions.items.unshift({
                            location: "after",
                            options: {
                                hint: "Thêm tệp đính kèm",
                                icon: "icon icon-add",
                                onClick: () => {
                                    self.maintenanceFileInput.trigger("click");
                                },
                                type: "success"
                            },
                            widget: "dxButton"
                        });
                    },
                    pager: {
                        allowedPageSizes: [50, 100, 200],
                        infoText: "{2} bản ghi",
                        showInfo: true,
                        showNavigationButtons: false,
                        showPageSizeSelector: true,
                        visible: false
                    },
                    paging: {
                        enabled: false,
                        pageSize: 50
                    },
                    scrolling: {
                        showScrollbar: "always"
                    },
                    selection: {
                        mode: "single"
                    },
                    showBorders: true,
                    showColumnHeaders: false,
                    width: "100%"
                }).dxDataGrid("instance");
                // List Chat
                this.maintenanceChatList = $("<div />").height("250px").appendTo(this.maintenanceChatContainer).dxList({
                    dataSource: self.maintenanceChatDatasource,
                    height: "250",
                    itemTemplate: (data) => {
                        if (data.image_url) {
                            data.full_image_url = `${self.config.CDNUrl}${self.config.ImagePath}/${data.image_url}`;
                        }
                        return ChatItemFunc(data);
                    },
                    noDataText: "Không có lịch sử trao đổi",
                    onContentReady: (e) => {
                        e.element.find(".dx-list-item").css("border-top", "none!important").css("border-bottom", "none!important");
                        e.element.find(".dx-list-item-content").css("padding", "0");
                    },
                    scrollingEnabled: true,
                    selectionMode: "none",
                    width: "100%",
                }).dxList("instance");
                this.maintenanceChatContainer.append(Handlebars.compile(SendMessageTmp)({}));
                //
                this.maintenanceFormToolbar = $("<div>").appendTo(this.toolbarFormContainer).dxToolbar({
                    items: [{
                        location: "center",
                        options: {
                            onClick: () => {
                                self.save();
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
                                this.maintenancePopup.hide();
                            },
                            stylingMode: "contained",
                            text: "Hủy",
                            type: "danger"
                        },
                        widget: "dxButton"
                    }]
                }).dxToolbar("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: "100%",
            hideOnOutsideClick: false,
            onContentReady: () => {
            },
            onHiding: () => {
                self.refreshCreateMaintenance();
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
            title: "Thêm công việc kiểm tra",
            width: "100%",
        }).dxPopup("instance");

        this.maintenanceGrid = $("<div />").appendTo(this.maintenanceGridContainer).dxDataGrid({
            allowColumnReordering: true,
            allowColumnResizing: true,
            columnChooser: {
                enabled: true,
                mode: "select",
                // position: "after",
            },
            columns: [{
                alignment: "center",
                caption: "STT",
                cellTemplate: (container, options) => {
                    const pageIndex = this.maintenanceGrid.pageIndex();
                    const pageSize = this.maintenanceGrid.pageSize();
                    container.append((pageSize * pageIndex) + options.row["dataIndex"] + 1);
                },
                dataField: "index",
                width: 50,
            }, {
                caption: "Mô tả",
                dataField: "wdesc",
            }, {
                caption: "Đơn vị quản lý",
                dataField: "org_id",
                lookup: {
                    dataSource: {
                        store: this.organizationStore,
                    },
                    displayExpr: "mo_ta",
                    // placeholder: "[Chọn ...]",
                    valueExpr: "id",
                }
            }, {
                caption: "Đơn vị thực hiện",
                dataField: "worg_id",
                lookup: {
                    dataSource: {
                        store: this.organizationStore,
                    },
                    displayExpr: "mo_ta",
                    // placeholder: "[Chọn ...]",
                    valueExpr: "id",
                }
            }, {
                caption: "Loại thực hiện",
                dataField: "obj_type_id",
                lookup: {
                    dataSource: {
                        store: this.objTypeStore,
                    },
                    displayExpr: "mo_ta",
                    // placeholder: "[Chọn ...]",
                    valueExpr: "id",
                }
            }, {
                caption: "Kiểu công việc",
                dataField: "wtype_id",
                lookup: {
                    dataSource: {
                        store: this.wTypeStore,
                    },
                    displayExpr: "mo_ta",
                    // placeholder: "[Chọn ...]",
                    valueExpr: "id",
                }
            }, {
                caption: "Kết quả thực hiện",
                dataField: "wtype_result_id",
                lookup: {
                    dataSource: {
                        store: this.wTypeResultStore,
                    },
                    displayExpr: "mo_ta",
                    // placeholder: "[Chọn ...]",
                    valueExpr: "id",
                }
            }, {
                caption: "Trạng thái",
                dataField: "wstatus_id_all",
                lookup: {
                    dataSource: {
                        store: this.worderStatusStore,
                    },
                    displayExpr: "mo_ta",
                    // placeholder: "[Chọn ...]",
                    valueExpr: "id",
                }
            }, {
                caption: "Ngày bắt đầu",
                dataField: "actual_start_date",
                dataType: "date"
            }, {
                caption: "Ngày kết thúc",
                dataField: "actual_finish_date",
                dataType: "date"
            }, {
                alignment: "center",
                allowEditing: false,
                caption: "Thao tác",
                cellTemplate: (container, options) => {
                    $("<div>").appendTo(container).dxToolbar({
                        items: [{
                            location: "center",
                            options: {
                                hint: "Xem thông tin công việc kiểm tra",
                                icon: "icon icon-info-circle",
                                onClick: () => {
                                    const worder_id = options.data.worder_id;
                                    $.get("/api/maintenance/" + worder_id).done(response => {
                                        if (response.status == "OK") {
                                            self.bindMaintenance(response.data);
                                            self.disableMaintenancePopup();
                                            self.maintenancePopup.option("title", "Thông tin công việc kiểm tra");
                                            self.maintenancePopup.show();
                                        }
                                    });
                                },
                                type: "default"
                            },
                            widget: "dxButton"
                        }, {
                            location: "center",
                            options: {
                                hint: "In phiểu công việc kiểm tra",
                                icon: "icon icon-printer",
                                onClick: () => {
                                    const worder_id = options.data.worder_id;
                                    $.get("/api/maintenance/" + worder_id).done(response => {
                                        if (response.status == "OK") {
                                            const data = response.data;
                                            let counter = 1;
                                            if (data.worderAssets && data.worderAssets.length) {
                                                data.worderAssets.forEach(x => {
                                                    x.counter = counter++;
                                                });
                                            }
                                            data["worderAssetGroupByLayers"] = self.groupBy(data.worderAssets, asset => asset.layer_name);
                                            self.bindMaintenanceItemIframe(data);
                                            if (self.maintenanceItemIframe) {
                                                self.maintenanceItemIframe.get(0)["contentWindow"].print();
                                            }
                                        }
                                    });
                                },
                                type: "default"
                            },
                            widget: "dxButton"
                        }, {
                            location: "center",
                            options: {
                                hint: "Chỉnh sửa công việc kiểm tra",
                                icon: "icon icon-edit-2",
                                onClick: () => {
                                    const worder_id = options.data.worder_id;
                                    $.get("/api/maintenance/" + worder_id).done(response => {
                                        if (response.status == "OK") {
                                            self.bindMaintenance(response.data);
                                            self.unDisableMaintenancePopup();
                                            self.maintenancePopup.option("title", "Chỉnh sửa công việc kiểm tra");
                                            self.maintenancePopup.show();
                                        }
                                    });
                                },
                                type: "success"
                            },
                            widget: "dxButton"
                        }, {
                            location: "center",
                            options: {
                                hint: "Xóa công việc kiểm tra",
                                icon: "icon icon-trash",
                                onClick: () => {
                                    OGUtils.confirm("Bạn muốn xóa công việc kiểm tra này?").then(value => {
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
                        }]
                    });
                },
                dataField: "id",
                width: 200,
            }],
            dataSource: {
                store: this.maintenanceStore
            },
            errorRowEnabled: false,
            filterRow: { visible: true },
            filterSyncEnabled: false,
            height: "100%",
            loadPanel: {
                text: "Đang tải dữ liệu"
            },
            noDataText: "Không có dữ liệu",
            onContentReady: (e) => {
                e.element.find(".dx-datagrid-header-panel > .dx-toolbar").css("padding", "5px").css("margin", "0");
            },
            onRowUpdating: function (options) {
                $.extend(options.newData, $.extend({}, options.oldData, options.newData));
            },
            onToolbarPreparing: (e) => {
                e.toolbarOptions.items.unshift({
                    location: "after",
                    options: {
                        icon: "icon icon-search-normal-1",
                        onValueChanged: (e) => {
                            self.arguments["key"] = e.value;
                            self.maintenanceGrid.getDataSource().reload();
                        },
                        placeholder: "Nhập từ khóa",
                        width: 200
                    },
                    widget: "dxTextBox"
                }, {
                    location: "after",
                    options: {
                        hint: "In công việc kiểm tra",
                        icon: "icon icon-printer",
                        onClick: () => {
                            if (this.maintenanceIframe) {
                                this.maintenanceIframe.get(0)["contentWindow"].print();
                            }
                        },
                        type: "default",
                        visible: false
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        hint: "Xuất excel công việc kiểm tra",
                        icon: "icon icon-ram",
                        onClick: () => {
                            OGUtils.postDownload("/api/maintenance/export", self.arguments);
                        },
                        type: "success"
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        hint: "Thêm công việc kiểm tra mới",
                        icon: "icon icon-add",
                        onClick: () => {
                            self.unDisableMaintenancePopup();
                            self.maintenancePopup.option("title", "Thêm công việc kiểm tra mới");
                            self.maintenancePopup.show();
                        },
                        type: "default"
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        hint: "Làm mới",
                        icon: "icon icon-refresh",
                        onClick: () => {
                            this.maintenanceGrid.getDataSource().reload();
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
            selection: {
                mode: "single"
            },
            showBorders: true,
            showRowLines: true,
            width: "100%",

        }).dxDataGrid("instance");

        this.maintenanceIframe = $("<iframe />")
            .prop("frameborder", "0")
            .css("width", "100%")
            .css("height", "100vh")
            .css("overflow", "hidden")
            .css("display", "none").appendTo("body");

        this.maintenanceItemIframe = $("<iframe />")
            .prop("frameborder", "0")
            .css("width", "100%")
            .css("height", "100vh")
            .css("overflow", "hidden")
            .css("display", "none").appendTo("body");
    }

    private _initMaintenanceAsset(): void {
        const self = this;

        $(document).on("keydown", "#keyword-search-thietbi", (e) => {
            if (e.key === "Enter" || e.keyCode === 13) {
                $(".search-form").trigger("submit");
            }
        });
        $(document).on("submit", "#search-asset-form", function (e) {
            e.preventDefault();
            self.searchTabs.option("selectedIndex", 1);
            self.searchThietBiResultsGrid.getDataSource().reload();
        });

        //Popup tìm kiếm tài sản cần kiểm tra
        self.maintenanceAssetPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                container.css("padding", "0");
                self.searchTabs = $("<div />").appendTo(container).dxTabPanel({
                    //swipeEnabled: false,
                    deferRendering: false,
                    height: "100%",
                    items: [
                        {
                            template: (itemData, itemIndex, itemElement) => {
                                const row = $("<div />").appendTo(itemElement).height("100%");
                                this.searchLayerTreeContainer = $("<div />").appendTo(row).height("100%").css("padding-right", "0").css("width", "500px").css("float", "left");
                                this.searchLayerTreeContainer.append(Handlebars.compile(SearchTemp)({}));
                                $("<div/>").css("padding", "10px 10px 5px").css("font-weight", 500).append("<p>Chọn lớp dữ liệu cần tìm kiếm</p>").appendTo(this.searchLayerTreeContainer);
                            },
                            title: "Điều kiện tìm kiếm"
                        }, {
                            template: (itemData, itemIndex, itemElement) => {
                                const row = $("<div />").appendTo(itemElement).height("100%");
                                this.searchResultContainer = $("<div />").appendTo(row).height("100%").css("padding-right", "0").css("width", "500px").css("float", "left");
                            },
                            title: "Kết quả tìm kiếm"
                        }],
                    //loop: false,
                    //animationEnabled: false,
                    onContentReady: () => {
                    },
                }).dxTabPanel("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: 600,
            hideOnOutsideClick: false,
            onHiding: () => {

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
            title: "Tìm kiếm thiết bị công trình cần kiểm tra",
            width: 500,
        }).dxPopup("instance");
        //LayerTree
        self.searchLayerTree = $("<div/>").appendTo(self.searchLayerTreeContainer).addClass("layer-tree")
            .dxTreeView({
                dataSource: new DataSource({
                    key: "id",
                    store: new CustomStore({
                        key: "id",
                        load: () => {
                            const deferred = $.Deferred();

                            OGUtils.showLoading();
                            if (this.schema) {
                                $.get("/api/layer/getLayersAndGroupLayers", {
                                    table_schema: this.schema
                                }).done((result) => {
                                    OGUtils.hideLoading();
                                    deferred.resolve({
                                        data: result.data || [], 
                                        totalCount: result.data ? result.data.length : 0
                                    });
                                });
                            } else {
                                $.get("/api/layer/getAllLayersAndGroupLayers").done((result) => {
                                    OGUtils.hideLoading();
                                    deferred.resolve({
                                        data: result.data || [], 
                                        totalCount: result.data ? result.data.length : 0
                                    });
                                });
                            }

                            return deferred.promise();
                        }
                    })
                }),
                focusStateEnabled: false,
                height: 420,
                hoverStateEnabled: false,
                itemTemplate: (itemData, index, element) => {
                    element.append("<span class= \"layerItem\">" + itemData.text + "</span>");
                },
                searchEnabled: true,
                showCheckBoxesMode: "normal",
                width: "100%",
            }).dxTreeView("instance");
        //DataGrid
        self.searchThietBiResultsGrid = $("<div>").appendTo(self.searchResultContainer).dxDataGrid({
            columns: [{
                caption: "Nhóm lớp dữ liệu",
                dataField: "layer_group_name",
                groupIndex: 0,
            }, {
                caption: "Lớp dữ liệu",
                dataField: "layer_name",
                groupIndex: 1
            }, {
                dataField: "id",
                visible: false,
            }, {
                dataField: "uid",
                visible: false,
            }, {
                caption: "Thiết bị, công trình",
                dataField: "name"
            }, {
                buttons: [{
                    hint: "Xem thông tin thiết bị công trình",
                    onClick: (e) => {
                        const layer_id = e.row.data.layer_id;
                        const layer_name = e.row.data.layer_name;
                        const asset_id = e.row.data.id;
                        self.buildAssetInfo(layer_id, layer_name, asset_id);
                        self.maintenanceAssetInfoPopup.show();
                    },
                    template: () => {
                        return $("<i>").addClass("icon icon-info-circle");
                    }
                }, {
                    hint: "Chọn thiết bị công trình cần kiểm tra",
                    onClick: (e) => {
                        const data: OGWorderAssetModel = {
                            asset_id: e.row.data.id,
                            asset_name: e.row.data.name,
                            id: e.row.data.uid,
                            layer_id: e.row.data.layer_id,
                            layer_name: e.row.data.layer_name
                        };
                        self.maintenanceAssetDatasource.push(data);
                        self.maintenanceAssetGrid.option("dataSource", self.maintenanceAssetDatasource);
                    },
                    template: () => {
                        return $("<i>").addClass("icon icon-add-circle");
                    }
                }],
                type: "buttons"
            }],
            dataSource: {
                store: new CustomStore({
                    key: "uid",
                    load: (loadOptions) => {
                        const deferred = $.Deferred(),
                            args = {};
                        args["skip"] = loadOptions.skip ? loadOptions.skip : 0;
                        args["take"] = loadOptions.take ? loadOptions.take : 15;
                        args["keyword"] = $("#keyword-search-thietbi").val();
                        const nodes = self.searchLayerTree.getSelectedNodes();
                        args["layer_id"] = [];
                        $.each(nodes, function (i, node) {
                            if (node.itemData.type == "@layer") {
                                args["layer_id"].push(node.itemData.raw.id);
                            }
                        });
                        if (args["keyword"]) {
                            $.ajax({
                                contentType: "application/json",
                                data: JSON.stringify(args),
                                dataType: "json",
                                error: () => {
                                    deferred.reject("Data Loading Error");
                                },
                                success: (result) => {
                                    deferred.resolve({
                                        data: result.data.dataSearch.items, 
                                        totalCount: result.data.dataSearch.totalCount
                                    });
                                },
                                type: "post",
                                url: (this.layerInfo && this.layerInfo.id) ? "/api/feature/advanced-search" : "/api/feature/quick-search",
                            });
                        } else {
                            deferred.resolve({
                                data: [], 
                                totalCount: 0
                            });
                        }
                        return deferred.promise();
                    }
                })
            },
            errorRowEnabled: false,
            grouping: {
                autoExpandAll: true
            },
            height: 520,
            loadPanel: {
                text: "Đang tải dữ liệu"
            },
            noDataText: "Không có dữ liệu",
            onContentReady: () => {
                /*this.g_GridContainer.find('.dx-datagrid-header-panel').css('padding', '0 5px');*/
            },
            onRowClick: () => {

            },
            pager: {
                infoText: "{2} bản ghi",
                showInfo: true,
                showNavigationButtons: true,
                showPageSizeSelector: true,
                // allowedPageSizes: [15, 25, 50],
                visible: true
            },
            paging: {
                enabled: true,
                pageSize: 15
            },
            remoteOperations: {
                groupPaging: false
            },
            scrolling: {
                showScrollbar: "always"
            },
            selection: {
                mode: "single",
                showCheckBoxesMode: "none"
            },
            showBorders: false,
            showColumnHeaders: false,
            width: "100%"
        }).dxDataGrid("instance");
        setInterval(() => {
            this.searchThietBiResultsGrid.updateDimensions();
        }, 500);
    }

    private _initMaintenanceAssetInfo(): void {
        const self = this;
        this.maintenanceAssetInfoPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                container.css("padding", "0");
                //
                this.maintenanceAssetInfo = $("<div/>").appendTo(container).dxDataGrid({
                    allowColumnReordering: true,
                    allowColumnResizing: true,
                    columns: [{
                        dataField: "key",
                        visible: false
                    }, {
                        dataField: "order_id",
                        sortOrder: "asc",
                        visible: false
                    }, {
                        alignment: "left",
                        caption: "Thông tin",
                        dataField: "label",
                        width: "50%"
                    }, {
                        alignment: "left",
                        caption: "Giá trị",
                        dataField: "value",
                        width: "50%"
                    }],
                    dataSource: {
                        store: new CustomStore({
                            key: "key",
                            load: () => {
                                if (this.maintenanceAssetInfoDataSource && this.maintenanceAssetInfoDataSource.length > 0) {
                                    return this.maintenanceAssetInfoDataSource;
                                }
                                else {
                                    return [];
                                }
                            }
                        })
                    },
                    grouping: {
                        autoExpandAll: false
                    },
                    height: "100%",
                    onContentReady: () => {
                    },
                    paging: {
                        enabled: true,
                        pageIndex: 0,
                        pageSize: 100
                    },
                    remoteOperations: {
                        groupPaging: false
                    },
                    rowAlternationEnabled: true,
                    scrolling: {
                        showScrollbar: "always"
                    },
                    selection: {
                        mode: "single",
                        showCheckBoxesMode: "none"
                    },
                    showBorders: true,
                    showColumnHeaders: true,
                    width: "100%",
                    wordWrapEnabled: true
                }).dxDataGrid("instance");
            },
            deferRendering: false,
            dragEnabled: true,
            height: 600,
            hideOnOutsideClick: false,
            onHiding: () => {
                self.maintenanceAssetInfoDataSource = [];
                self.maintenanceAssetInfo.getDataSource().reload();
            },
            onOptionChanged: () => {
            },
            position: {
                at: "right top",
                of: "body",
                offset: "-250 380"
            },
            resizeEnabled: true,
            shading: false,
            showTitle: true,
            title: "Thông tin thiết bị công trình",
            width: 400,
        }).dxPopup("instance");
    }

    private _initMaintenanceChat(): void {
        const self = this;
        this.files = [];
        this.newMaintenanceChats = [];
        //Lưu chat
        $(document).on("click", "#btnSendChat", function (e) {
            e.preventDefault();
            $("#formChat").trigger("submit");
        });
        //
        $(document).on("keydown", "#chat-message", (e) => {
            if (e.key === "Enter" || e.keyCode === 13) {
                $("#formChat").trigger("submit");
            }
        });
        $(document).on("submit", "#formChat", function (e) {
            e.preventDefault();
            self.saveChat();
        });
        //
        self.fileInput = $("<input type=\"file\" accept=\"image/*\" style=\"display:none !important\" />")
            .appendTo($("#formChat"))
            .on("change", (e) => {
                for (let i = 0; i < e.target["files"].length; i++) {
                    const file = e.target["files"][i];
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        const url = e.target.result;
                        $(".input-image").append(`<input type="image" id="chat-image" src ="${url}" height="150">`);
                        self.files.push({
                            extension: file.name.substring(file.name.lastIndexOf(".")),
                            image_name: file.name,
                            mime_type: file.type,
                            raw: file,
                            size: file.size,
                            uid: OGUtils.uuidv4(),
                            url: url.toString()
                        });
                    };
                    reader.readAsDataURL(file);
                }
            });
        //Upload file
        $(document).on("click", "#btnUploadImage", function () {
            self.fileInput.trigger("click");
        });
    }

    private _initMaintenanceFile(): void {
        const self = this;
        this.maintenanceFiles = [];
        //
        self.maintenanceFileInput = $("<input type=\"file\" multiple style=\"display:none !important\" />")
            .appendTo($("#formChat"))
            .on("change", (e) => {
                for (let i = 0; i < e.target["files"].length; i++) {
                    const file = e.target["files"][i];
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        const url = e.target.result;
                        const dataFile: OGMaintenanceFileModel = {
                            extension: file.name.substring(file.name.lastIndexOf(".")),
                            file: file,
                            file_name: file.name,
                            mime_type: file.type,
                            size: file.size,
                            uid: OGUtils.uuidv4(),
                            url: url.toString()
                        };
                        self.maintenanceFiles.push(dataFile);
                        self.maintenanceFilesGrid.option("dataSource", self.maintenanceFiles);
                    };
                    reader.readAsDataURL(file);
                }
            });
    }

    private _initMaintenanceProcessExist(): void {
        const self = this;
        this.maintenanceProcessPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                container.css("padding", "10px");
                this.maintenanceProcessForm = $("<form />").appendTo(container)
                    .dxForm({
                        height: "100%",
                        items: [{
                            dataField: "process_exist_id",
                            visible: false
                        }, {
                            dataField: "obj_type_id",
                            editorOptions: {
                                dataSource: this.objTypeStore,
                                displayExpr: "mo_ta",
                                height: 30,
                                onContentReady: () => {
                                    $(".dx-list-item-content").each(function () {
                                        const $ele = $(this);
                                        if (this.offsetWidth < this.scrollWidth) {
                                            $ele.attr("title", $ele.text());
                                        }
                                    });
                                },
                                placeholder: "[Chọn...]",
                                searchEnabled: true,
                                valueExpr: "id",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Loại thực hiện",
                            },
                        }, {
                            dataField: "date_solution_exist",
                            editorOptions: {
                                dateSerializationFormat: "yyyy-MM-ddTHH:mm:ss",
                                displayFormat: "dd/MM/yyyy",
                                height: 30,
                                invalidDateMessage: "Vui lòng nhập đúng định dạng: dd/MM/yyyy",
                                placeholder: "Ngày phát hiện",
                                showClearButton: true,
                                type: "date",
                            },
                            editorType: "dxDateBox",
                            label: {
                                text: "Ngày phát hiện",
                            },
                        }, {
                            dataField: "status_id",
                            editorOptions: {
                                dataSource: [
                                    { id: 0, text: "Chưa xử lý" },
                                    { id: 1, text: "Đã xử lý" },
                                    { id: 2, text: "Không xử lý" },
                                ],
                                displayExpr: "text",
                                height: 30,
                                onContentReady: () => {
                                    $(".dx-list-item-content").each(function () {
                                        const $ele = $(this);
                                        if (this.offsetWidth < this.scrollWidth) {
                                            $ele.attr("title", $ele.text());
                                        }
                                    });
                                },
                                placeholder: "[Chọn...]",
                                valueExpr: "id",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Trạng thái",
                            },
                        }, {
                            dataField: "solution_exist",
                            editorType: "dxTextArea",
                            label: {
                                text: "Mô tả tồn tại",
                            },
                        }, {
                            template: (itemData, itemElement) => {
                                $("<div />").appendTo(itemElement)
                                    .dxToolbar({
                                        items: [{
                                            location: "center",
                                            options: {
                                                onClick: () => {
                                                    const validate = self.maintenanceProcessForm.validate();
                                                    if (validate && validate.brokenRules.length === 0) {
                                                        const data: OGProcessExistModel = self.maintenanceProcessForm.option("formData");
                                                        self.maintenanceProcessDatasource.push(data);
                                                        self.maintenanceProcessGrid.option("dataSource", self.maintenanceProcessDatasource);
                                                        self.maintenanceProcessPopup.hide();
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
                                                    self.maintenanceProcessPopup.hide();
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
                        labelLocation: "top",
                        scrollingEnabled: true,
                    }).dxForm("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: "auto",
            hideOnOutsideClick: false,
            onHiding: () => {
                this.maintenanceProcessForm.option("formData", {});
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
            title: "Thông tin tồn tại của công việc kiểm tra",
            width: 500,
        }).dxPopup("instance");
    }

    private bindEvents(): void {
        const self = this;
        $(document).on("click", ".switch-module-action", function () {
            self.switchModule.showPopup();
        });
    }

    private bindMaintenance(data: OGWorderModel): void {
        this.maintenanceForm.option("formData", data);
        this.maintenanceAssetDatasource = data.worderAssets;
        this.maintenanceAssetGrid.option("dataSource", this.maintenanceAssetDatasource);
        this.maintenanceProcessDatasource = data.processExists;
        this.maintenanceProcessGrid.option("dataSource", this.maintenanceProcessDatasource);
        this.maintenanceFiles = data.maintenanceFiles;
        this.maintenanceFilesGrid.option("dataSource", this.maintenanceFiles);
        this.maintenanceChatDatasource = data.maintenanceChats;
        this.maintenanceChatList.option("dataSource", this.maintenanceChatDatasource);
    }

    private bindMaintenanceIframe(data: MaintenanceIframeBindModel): void {
        this.maintenanceIframe[0]["contentWindow"].document.open();
        const content = Handlebars.compile(DanhSachKiemTraTemp)(data);
        this.maintenanceIframe[0]["contentWindow"].document.write(content);
        this.maintenanceIframe[0]["contentWindow"].document.close();
    }

    private bindMaintenanceItemIframe(data: MaintenanceIframeBindModel): void {
        this.maintenanceItemIframe[0]["contentWindow"].document.open();
        const content = Handlebars.compile(PhieuKiemTraTemp)(data);
        this.maintenanceItemIframe[0]["contentWindow"].document.write(content);
        this.maintenanceItemIframe[0]["contentWindow"].document.close();
    }

    private buildAssetInfo(layer_id: number, layer_name: string, asset_id: number): void {
        const self = this;
        self.maintenanceAssetInfoDataSource = [];
        $.when($.get("/api/feature/query-feature/" + layer_id + "/" + asset_id),
            $.get("/api/layer/get-fields?id=" + layer_id)).done((featureResponse, columnsResponse) => {
            featureResponse = featureResponse[0];
            const columns: OGTableColumnModel[] = columnsResponse[0].data;
            //
            OGUtils.hideLoading();
            //
            const domain = featureResponse.data.domain_values;
            const properties = featureResponse.data.feature;
            //
            const domainKeys = Object.keys(domain);
            columns.sort((a, b) => {
                if (a.order === b.order)
                    return 0;
                else if (a.order > b.order)
                    return 1;
                else return -1;
            }).forEach((column) => {
                if (column && column.column_name !== "id" && column.column_name !== "geom" && column.visible) {
                    let value = properties[column.column_name];
                    //
                    if (column.lookup_table_id > 0 && domainKeys.indexOf(column.column_name)) {
                        // fix later
                    } else {
                        switch (column.data_type) {
                            case EnumDataType.date:
                                value = moment(new Date(value)).format("DD/MM/YYYY");
                                break;
                            case EnumDataType.dateTime:
                                value = moment(new Date(value)).format("DD/MM/YYYY HH:mm:ss");
                                break;
                            case EnumDataType.string:
                            case EnumDataType.text:
                                if (column.column_name == "province_code") {
                                    value = properties["province_name"];
                                } else if (column.column_name == "district_code") {
                                    value = properties["district_name"];
                                } else if (column.column_name == "commune_code") {
                                    value = properties["commune_name"];
                                } else {
                                    value = value || "";
                                }
                                break;
                            case EnumDataType.bool:
                                value = value ? "Có" : "Không";
                                break;
                            case EnumDataType.integer:
                                value = parseInt(value) || 0;

                                break;
                            case EnumDataType.double:
                                value = parseFloat(value) || 0.0;
                                break;
                        }
                    }
                    self.maintenanceAssetInfoDataSource.push({
                        key: column.column_name,
                        label: column.name_vn,
                        order: column.order,
                        value: value
                    });
                }
            });
            self.maintenanceAssetInfo.getDataSource().reload();
        });
    }

    private disableMaintenancePopup(): void {
        this.maintenanceForm.option("disabled", true);
        this.maintenanceAssetGrid.option("disabled", true);
        this.maintenanceProcessGrid.option("disabled", true);
        this.maintenanceFilesGrid.option("disabled", true);
        this.maintenanceChatList.option("disabled", true);
        this.toolbarFormContainer.css("display", "none");
        $("#chat-message").prop("disabled", true);
        $("#btnUploadImage").prop("disabled", true);
        $("#btnSendChat").prop("disabled", true);
    }

    //Summary :
    //    Nhóm một mảng đối tương
    //Parameters:
    //    list: Mảng
    //    keyGetter: Hàm lấy key nhóm đối tượng
    //Returns :
    //   Mảng đối tượng sau khi nhóm theo key
    private groupBy(list: Array<object>, keyGetter: (object) => string): [] {
        const map = new Map();
        list.forEach((item) => {
            const key = keyGetter(item);
            const collection = map.get(key);
            if (!collection) {
                map.set(key, [item]);
            } else {
                collection.push(item);
            }
        });
        return Object.fromEntries(map);
    }

    private refreshCreateMaintenance(): void {
        this.maintenanceForm.option("formData", {});
        this.deleteProcessExist = [];
        this.maintenanceAssetDatasource = [];
        this.maintenanceProcessDatasource = [];
        this.maintenanceFiles = [];
        this.deleteMaintenanceFileIds = [];
        this.maintenanceChatDatasource = [];
        this.maintenanceAssetGrid.option("dataSource", []);
        this.maintenanceProcessGrid.option("dataSource", []);
        this.maintenanceFilesGrid.option("dataSource", []);
        this.maintenanceChatList.option("dataSource", []);
        this.files = [];
        $(".input-image").empty();
        $("#formChat").trigger("reset");
    }

    private save(): void {
        const self = this;
        const validate = self.maintenanceForm.validate();
        if (validate && validate.brokenRules.length === 0) {
            const data = JSON.parse(JSON.stringify(self.maintenanceForm.option("formData")));
            data.worderAssets = self.maintenanceAssetDatasource;
            data.processExists = self.maintenanceProcessDatasource;
            data.deleteProcessExists = self.deleteProcessExist;
            data.deleteMaintenanceFileIds = self.deleteMaintenanceFileIds.join(",");
            if (self.newMaintenanceChats && self.newMaintenanceChats.length) {
                data.maintenanceChats = self.newMaintenanceChats.filter(maintenanceChat => { return (!maintenanceChat.file); });
            }
            data.maintenanceFiles = [];
            OGUtils.showLoading();
            $.ajax({
                contentType: "application/json",
                data: JSON.stringify(data),
                error: (xhr) => {
                    OGUtils.alert(xhr["errors"][0].message, "Lỗi");
                },
                type: "POST",
                url: "/api/maintenance/save",
            }).done(xhr => {
                if (xhr.status == "OK") {
                    const worder_id = xhr.data.worder_id;
                    const defArray = [];
                    if (self.maintenanceFiles && self.maintenanceFiles.length) {
                        defArray.push(new Promise((resolve) => {
                            const fileData = new FormData();
                            fileData.append("worder_id", worder_id);
                            //
                            $.each(self.maintenanceFiles, (idx, maintenanceFile) => {
                                if (!maintenanceFile.id) {
                                    fileData.append("files", maintenanceFile.file);
                                }
                            });
                            //
                            if (fileData.get("files")) {
                                const xhr = new XMLHttpRequest();
                                xhr.open("POST", "/api/maintenance/upload", true);
                                xhr.responseType = "json";
                                xhr.onload = function () {
                                };
                                xhr.onloadend = () => {
                                    resolve({});
                                };
                                xhr.send(fileData);
                            } else {
                                resolve({});
                            }
                        }));
                    }
                    if (self.newMaintenanceChats && self.newMaintenanceChats.length) {
                        defArray.push(new Promise((resolve) => {
                            const maintenanceChatFiles = self.newMaintenanceChats.filter(maintenanceChat => { return maintenanceChat.file; });
                            if (maintenanceChatFiles && maintenanceChatFiles.length > 0) {
                                const fileData = new FormData();
                                fileData.append("worder_id", worder_id);
                                //
                                $.each(maintenanceChatFiles, (idx, maintenanceChat) => {
                                    fileData.append("files", maintenanceChat.file as Blob);
                                });
                                //
                                if (fileData.get("files")) {
                                    const xhr = new XMLHttpRequest();
                                    xhr.open("POST", "/api/maintenance/chatFile/upload", true);
                                    xhr.responseType = "json";
                                    xhr.onload = function () {
                                    };
                                    xhr.onloadend = () => {
                                        resolve({});
                                    };
                                    xhr.send(fileData);
                                } else {
                                    resolve({});
                                }
                            } else {
                                resolve({});
                            }
                        }));
                    }
                    Promise.all(defArray).then(() => {
                        OGUtils.hideLoading();
                        self.newMaintenanceChats = [];
                        OGUtils.alert("Lưu kế hoạch kiểm tra thành công", "Thành công");
                        this.maintenanceGrid.getDataSource().reload();
                        this.maintenancePopup.hide();
                    });
                }
                else {
                    OGUtils.hideLoading();
                    OGUtils.alert(xhr.errors[0].message, "Lỗi");
                    this.maintenancePopup.hide();
                }
            });
        }
    }

    private saveChat(): void {
        const self = this;
        if (!self.maintenanceChatDatasource) {
            self.maintenanceChatDatasource = [];
        }
        if (!self.maintenanceChatDatasource) {
            self.maintenanceChatDatasource = [];
        }
        if (self.files && self.files.length) {
            $.each(self.files, function (idx, file) {
                const dataImage: OGThongTinTraoDoiModel = {
                    file: file.raw,
                    full_image_url: file.url,
                    uid: OGUtils.uuidv4(),
                    user_cr_dtime: moment(new Date(), "DD/MM/YYYY").format(),
                };
                self.maintenanceChatDatasource.push(dataImage);
                self.newMaintenanceChats.push(dataImage);
            });
        }
        const formData = $("#formChat").serializeArray();
        const data: OGThongTinTraoDoiModel = {
            user_cr_dtime: ""
        };
        formData.forEach(item => {
            data[item.name] = item.value;
        });
        data["uid"] = OGUtils.uuidv4();
        data["time_create_txt"] = OGUtils.getTimeFromDate(new Date());
        if (data["message"]) {
            self.maintenanceChatDatasource.push(data);
            self.newMaintenanceChats.push(data);
        }
        self.maintenanceChatList.option("dataSource", self.maintenanceChatDatasource);
        self.files = [];
        $(".input-image").empty();
        $("#formChat").trigger("reset");
    }

    private unDisableMaintenancePopup(): void {
        this.maintenanceForm.option("disabled", false);
        this.maintenanceAssetGrid.option("disabled", false);
        this.maintenanceProcessGrid.option("disabled", false);
        this.maintenanceFilesGrid.option("disabled", false);
        this.maintenanceChatList.option("disabled", false);
        this.toolbarFormContainer.css("display", "block");
        $("#chat-message").prop("disabled", false);
        $("#btnUploadImage").prop("disabled", false);
        $("#btnSendChat").prop("disabled", false);
    }

    onInit(): void {
        $(".tab-item-container").css({
            "background-color": "white"
        }).height(window.innerHeight - $("#header").outerHeight() - 15);
        this.bindEvents();
        this._initMaintenance();
        this._initMaintenanceAsset();
        this._initMaintenanceProcessExist();
        this._initMaintenanceFile();
        this._initMaintenanceAssetInfo();
        this._initMaintenanceChat();
    }
}
