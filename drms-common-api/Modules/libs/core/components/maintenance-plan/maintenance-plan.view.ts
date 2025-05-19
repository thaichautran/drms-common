import { feature } from "@turf/turf";
import axios from "axios";
import ArrayStore from "devextreme/data/array_store";
import CustomStore, { ResolvedData } from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import dxDataGrid from "devextreme/ui/data_grid";
import "devextreme/ui/data_grid";
import dxFileUploader from "devextreme/ui/file_uploader";
import dxForm from "devextreme/ui/form";
import "devextreme/ui/form";
import dxList from "devextreme/ui/list";
import dxPopup from "devextreme/ui/popup";
import "devextreme/ui/popup";
import "devextreme/ui/scroll_view";
import dxTabPanel from "devextreme/ui/tab_panel";
import "devextreme/ui/tag_box";
import "devextreme/ui/text_area";
import dxToolbar from "devextreme/ui/toolbar";
import dxTreeView from "devextreme/ui/tree_view";
import * as docx from "docx-preview";
import ExcelViewer from "excel-viewer";
import Handlebars from "handlebars";
import moment from "moment";

import { EnumMap, EnumStatus } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { RestData } from "../../models/base-response.model";
import { OGConfigModel } from "../../models/config.model";
import { OGKeHoachCongTrinhModel, OGKeHoachCongViecModel, OGKeHoachKiemTraDinhKemModel, OGKeHoachKiemTraModel, OGKeHoachNhanVienModel, OGNhaThau } from "../../models/kiem-tra/ke-hoach-kiem-tra.model";
import { OGLayerModel } from "../../models/layer.model";
import { OGNhanVienModel } from "../../models/nhan-vien.model";
import { DmHangMucCongViecService } from "../../services/kiem-tra/dm-hangmuccongviec.service";
import { DmNhaThauService } from "../../services/kiem-tra/dm-nhathau.service";
import { KeHoachKiemTraService } from "../../services/kiem-tra/ke-hoach-kiem-tra.service";
import { KeHoachKiemTraDinhKemService } from "../../services/kiem-tra/kehoach-dinhkem.service";
import { LayerService } from "../../services/layer.service";
import { NhanVienService } from "../../services/nhan-vien.service";
import { UploadService } from "../../services/upload.service";
import { IBaseComponent } from "../base-component.abstract";
import { IdentifyComponent } from "../identify/identify.component";
const allowedView = [".pdf", ".doc", ".docx", ".xls", ".xlsx"];

class OGPlanMaintenanceViewOptions {
    config?: OGConfigModel;
    identify?: IdentifyComponent;
    loaiKiemTra?: string;
    loaiNhanVienId?: number;
    mapId?: number;

}
class MaintenancePlanView implements IBaseComponent {
    arguments: object;
    baoCaoTongHopGrid: dxDataGrid;
    baoCaoTongHopPopup: dxPopup;
    columnRightContainer: JQuery<HTMLElement>;
    config: OGConfigModel;
    congTrinhBaoDuongDataSource: OGKeHoachCongTrinhModel[];
    congTrinhBaoDuongGrid: dxDataGrid;
    congTrinhBaoDuongGridContainer: JQuery<HTMLElement>;
    congTrinhBaoDuongPopup: dxPopup;
    congViecDatasource: OGKeHoachCongViecModel[];
    congViecGrid: dxDataGrid;
    congViecGridContainer: JQuery<HTMLElement>;
    container: JQuery<HTMLElement>;
    dxAttachmentUpload: dxFileUploader;
    fileList: dxList<OGKeHoachKiemTraDinhKemModel, number>;
    giaoViecNhanVienDatasource: OGKeHoachNhanVienModel[];
    giaoViecNhanVienForm: dxForm;
    giaoViecNhanVienGrid: dxDataGrid;
    giaoViecNhanVienGridContainer: JQuery<HTMLElement>;
    giaoViecNhanVienPopup: dxPopup;
    identify: IdentifyComponent;
    importForm: dxForm;
    importPopup: dxPopup;
    ketQuaPopup: dxPopup;
    layerInfo: OGLayerModel;
    loaiHoSoStore: CustomStore;
    loaiKiemTra: string;
    loaiNhanVienId: number;
    maintenancePlanForm: dxForm;
    maintenancePlanFormContainer: JQuery<HTMLElement>;
    maintenancePlanFormToolbar: dxToolbar;
    maintenancePlanGrid: dxDataGrid;
    maintenancePlanPopup: dxPopup;
    maintenancePlanStore: CustomStore;
    mapId: number;
    nhaThauStore: CustomStore<OGNhaThau, number>;
    nhanVienStore: CustomStore<OGNhanVienModel, number>;
    phuongThucKiemTraStore: CustomStore;
    resultGrid: dxDataGrid;
    schema: string;
    searchCongTrinhResultsGrid: dxDataGrid;
    searchEditor: JQuery<HTMLElement>;
    searchForm: dxForm;
    searchLayerTree: dxTreeView;
    searchLayerTreeContainer: JQuery<HTMLElement>;
    searchResultContainer: JQuery<HTMLElement>;
    searchTabs: dxTabPanel;
    tableSchema: string;
    tepDinhKemDatasource: OGKeHoachKiemTraDinhKemModel[] = [];
    tepDinhKemForm: dxForm;
    tepDinhKemGridContainer: JQuery<HTMLElement>;
    toolbarFormContainer: JQuery<HTMLElement>;

    constructor(container: JQuery<HTMLElement>, options: OGPlanMaintenanceViewOptions) {
        this.container = container;
        this.config = options.config;
        this.loaiNhanVienId = options.loaiNhanVienId;
        this.loaiKiemTra = options.loaiKiemTra;
        this.identify = options.identify;
        this.mapId = options.mapId;
        this.initLayout();

    }
    private bindMaintenancePlan(data: OGKeHoachKiemTraModel): void {
        this.maintenancePlanForm.option("formData", data);
        this.congTrinhBaoDuongDataSource = data.congTrinhs;
        this.congTrinhBaoDuongGrid.option("dataSource", this.congTrinhBaoDuongDataSource);
        this.giaoViecNhanVienDatasource = data.nhanViens;
        this.giaoViecNhanVienGrid.option("dataSource", this.giaoViecNhanVienDatasource);
        this.congViecDatasource = data.listCongViec || [];
        this.congViecGrid.option("dataSource", this.congViecDatasource);
        this.tepDinhKemDatasource = data.attachments;
        this.fileList.getDataSource().reload();
    }
    private initBaoCaoTongHopPopup(): void {
        const self = this;
        this.baoCaoTongHopPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                container.css("padding", "10px");
                this.baoCaoTongHopGrid = $("<div />").appendTo(container).dxDataGrid({
                    allowColumnReordering: true,
                    allowColumnResizing: true,
                    columnChooser: {
                        enabled: false,
                        mode: "select",
                    },
                    columns: [{
                        alignment: "center",
                        caption: "STT",
                        cellTemplate: (container, options) => {
                            const pageIndex = this.baoCaoTongHopGrid.pageIndex();
                            const pageSize = this.baoCaoTongHopGrid.pageSize();
                            container.append((pageSize * pageIndex) + options.row["dataIndex"] + 1);
                        },
                        dataField: "index",
                        visible: false,
                        width: 50
                    }, {
                        caption: "Tên",
                        dataField: "tenkehoach",
                    }, {
                        caption: "Địa điểm",
                        dataField: "diadiemthuchien",
                    }, {
                        caption: "Nội dung",
                        dataField: "noidung",
                    }, {
                        caption: "Ngày lập",
                        dataField: "ngaylapkehoach",
                        dataType: "date",
                        format: "dd/MM/yyyy",
                    }, {
                        caption: "Ngày bắt đầu thực hiện",
                        dataField: "ngaybatdau",
                        dataType: "date",
                        format: "dd/MM/yyyy",
                    }, {
                        caption: "Ngày kết thúc thực hiện",
                        dataField: "ngayketthuc",
                        dataType: "date",
                        format: "dd/MM/yyyy",
                    }, {
                        caption: "Tình trạng",
                        cellTemplate: (container, options) => {
                            container.append(options.data["ngayketthuc"] ? "Đã hoàn thành" : "Chưa hoàn thành");
                        },
                        dataField: null
                    }, {
                        caption: "Nhân viên phụ trách",
                        cellTemplate: (container, options) => {
                            if (options.data["nhanViens"].length) {
                                options.data["nhanViens"].forEach(item => {
                                    container.append(`<p>${item.nhanVien.tennhanvien}</p>`);
                                });
                            }
                        },
                        dataField: null
                    },],
                    dataSource: {
                        store: this.maintenancePlanStore
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
                                hint: "Làm mới",
                                icon: "icon icon-refresh",
                                onClick: () => {
                                    this.resultGrid.getDataSource().reload();
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
            },
            deferRendering: false,
            dragEnabled: false,
            height: "100%",
            hideOnOutsideClick: false,
            onHiding: () => {
            },
            onOptionChanged: () => {
            },
            onShown: (e) => {
                self.baoCaoTongHopGrid.getDataSource().reload();
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
            title: "Báo cáo tổng hợp kết quả kiểm tra",
            width: "100%",
        }).dxPopup("instance");
    }
    private initCongTrinhBaoDuong(): void {
        const self = this;
        //Popup tìm kiếm tài sản cần sửa chữa, bảo trì
        self.congTrinhBaoDuongPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                container.css("padding", "0");
                self.searchTabs = $("<div />").appendTo(container).dxTabPanel({
                    deferRendering: false,
                    height: "100%",
                    items: [
                        {
                            template: (itemData, itemIndex, itemElement) => {
                                const row = $("<div />").appendTo(itemElement).height("100%");
                                this.searchLayerTreeContainer = $("<div />").appendTo(row).height("100%").css("padding-right", "0").css("width", "500px").css("float", "left");
                                this.searchForm = $("<div />").appendTo(this.searchLayerTreeContainer)
                                    .dxForm({
                                        colCount: 1,
                                        height: "auto",
                                        items: [{
                                            dataField: "keyword",
                                            editorOptions: {
                                                onValueChanged: (data) => {
                                                    self.searchCongTrinhResultsGrid.getDataSource().reload();
                                                    self.searchTabs.option("selectedIndex", 1);
                                                },
                                                placeholder: "Nhập từ khóa....",
                                                showClearButton: true,
                                                valueChangeEvent: "change",
                                            },
                                            editorType: "dxTextBox",
                                            label: {
                                                text: "Từ khóa"
                                            }
                                        }],
                                        labelLocation: "top",
                                        labelMode: "hidden",
                                        scrollingEnabled: true,
                                        showColonAfterLabel: true,
                                    }).dxForm("instance");
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
                    onContentReady: () => {
                    },
                }).dxTabPanel("instance");
            },
            deferRendering: false,
            dragEnabled: true,
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
            resizeEnabled: true,
            shading: false,
            showCloseButton: true,
            showTitle: true,
            title: "Tìm kiếm thiết bị công trình cần sửa chữa, bảo trì",
            width: $(document).width() > 500 ? 500 : "100%",
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
                            if (this.mapId) {
                                $.get("/api/map/tree-layers", {
                                    mapId: this.mapId
                                }).then(xhr => {
                                    deferred.resolve({
                                        data: xhr.data,
                                        totalCount: xhr.data.length
                                    });
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
        self.searchCongTrinhResultsGrid = $("<div>").appendTo(self.searchResultContainer).dxDataGrid({
            allowColumnReordering: true,
            allowColumnResizing: true,
            columns: [{
                caption: "Nhóm lớp dữ liệu",
                dataField: "layer_group_name",
                groupIndex: 0,
            }, {
                caption: "Loại công trình",
                dataField: "table_name",
                groupCellTemplate: (cellElement, cellInfo) => {
                    cellElement.html(cellInfo.displayValue);
                },
                groupIndex: 1
            }, {
                caption: "Tuyến/Tài sản",
                dataField: "name"
            }, {
                alignment: "center",
                allowEditing: false,
                caption: "Thao tác",
                cellTemplate: (container, options) => {
                    $("<div>").appendTo(container).dxToolbar({
                        items: [{
                            location: "center",
                            options: {
                                hint: "Xem thông tin đối tượng",
                                icon: "icon icon-info-circle",
                                onClick: (e) => {
                                    self.identify.identifyRowTableFeature(options.data.id, options.data.table_id, options.data.table_name);
                                },
                                type: "default"
                            },
                            widget: "dxButton"
                        }, {
                            location: "center",
                            options: {
                                hint: "Chọn thiết bị công trình cần sửa chữa, bảo trì",
                                icon: "icon icon-add-circle",
                                onClick: (e) => {
                                    const data: OGKeHoachCongTrinhModel = {
                                        feature_id: options.data.id,
                                        feature_name: options.data.name,
                                        table_id: options.data.table_id,
                                        table_name: options.data.table_name,
                                        uid: options.data.uid,
                                    };
                                    if (!self.congTrinhBaoDuongDataSource) self.congTrinhBaoDuongDataSource = [];
                                    if (self.congTrinhBaoDuongDataSource.filter(x => x.uid == data.uid).length === 0) {
                                        self.congTrinhBaoDuongDataSource.push(data);
                                        self.congTrinhBaoDuongGrid.option("dataSource", self.congTrinhBaoDuongDataSource);
                                    } else {
                                        OGUtils.alert("Công trình này đã được thêm vào kế hoạch kiểm tra!");
                                    }
                                },
                                type: "success"
                            },
                            widget: "dxButton"
                        }]
                    });
                },
                dataField: "id",
                width: 120
            }],
            dataSource: {
                store: new CustomStore({
                    key: ["id", "table_id"],
                    load: (loadOptions) => {
                        const deferred = $.Deferred(),
                            args = {};
                        args["skip"] = loadOptions.skip ? loadOptions.skip : 0;
                        args["take"] = loadOptions.take ? loadOptions.take : 50;
                        const data = self.searchForm.option("formData");
                        args["keyword"] = data.keyword;
                        args["table_id"] = [];

                        const nodes = self.searchLayerTree.getSelectedNodes();
                        $.each(nodes, function (i, node) {
                            if (node.itemData.type == "@layer") {
                                args["table_id"].push(node.itemData.raw.table_info_id);
                            } else if (node.itemData.type === "@table") {
                                args["table_id"].push(node.itemData.raw.id);
                            }
                        });
                        if (args["keyword"]) {
                            const url = (this.layerInfo && this.layerInfo.id) ? "/api/feature/advancedSearch" : "/api/feature/quick-search";
                            axios.post(url, args).then((result) => {
                                if (result.data.status === EnumStatus.OK) {
                                    deferred.resolve({
                                        data: result.data.data.dataSearch.items,
                                        totalCount: result.data.data.dataSearch.totalCount
                                    });
                                } else {
                                    deferred.resolve({
                                        data: [],
                                        totalCount: 0
                                    });
                                }
                            }).catch(error => {
                                deferred.reject("Data Loading Error");
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
            height: 520,
            loadPanel: {
                text: "Đang tải dữ liệu"
            },
            noDataText: "Không có dữ liệu",
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
            remoteOperations: {
                paging: true,
            },
            scrolling: {
                showScrollbar: "always"
            },
            selection: {
                mode: "single",
                showCheckBoxesMode: "none"
            },
            showBorders: true,
            showColumnHeaders: false,
            width: "100%"
        }).dxDataGrid("instance");
        setInterval(() => {
            this.searchCongTrinhResultsGrid.updateDimensions();
        }, 500);
    }

    private initGiaoViecNhanVien(): void {
        const self = this;
        this.giaoViecNhanVienPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                container.css("padding", "10px");
                this.giaoViecNhanVienForm = $("<form />").appendTo(container)
                    .dxForm({
                        height: "100%",
                        items: [{
                            dataField: "phieugiamsat_id",
                            visible: false
                        }, {
                            dataField: "nhanvien_id",
                            editorOptions: {
                                dataSource: this.nhanVienStore,
                                displayExpr: "tennhanvien",
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
                                text: "Nhân viên",
                            },
                            validationRules: [{
                                message: "Vui lòng chọn nhân viên",
                                type: "required"
                            }]
                        }, {
                            dataField: "ghichu",
                            editorType: "dxTextArea",
                            label: {
                                text: "Ghi chú",
                            },
                        },
                        {
                            template: (itemData, itemElement) => {
                                $("<div />").appendTo(itemElement)
                                    .dxToolbar({
                                        items: [{
                                            location: "center",
                                            options: {
                                                onClick: () => {
                                                    const validate = self.giaoViecNhanVienForm.validate();
                                                    if (validate && validate.brokenRules.length === 0) {
                                                        const data: OGKeHoachNhanVienModel = self.giaoViecNhanVienForm.option("formData");
                                                        const existWorker = self.giaoViecNhanVienDatasource.filter(item => item.nhanvien_id === data.nhanvien_id);
                                                        if (existWorker.length === 0) {
                                                            self.giaoViecNhanVienDatasource.push(data);
                                                            self.giaoViecNhanVienGrid.option("dataSource", self.giaoViecNhanVienDatasource);
                                                        } else {
                                                            OGUtils.alert("Nhân viên đã được phân công vào kế hoạch này!", "Thông báo");
                                                        }
                                                        self.giaoViecNhanVienPopup.hide();
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
                                                    self.giaoViecNhanVienPopup.hide();
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
                this.giaoViecNhanVienForm.option("formData", {});
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
            title: "Phân công cho nhân viên",
            width: 500,
        }).dxPopup("instance");
    }
    private initImportPopup(): void {
        const self = this;
        let file;
        this.importPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.importForm = $("<div/>").appendTo(container).dxForm({
                    formData: {
                    },
                    items: [
                        {
                            dataField: "thoigian",
                            editorOptions: {
                                calendarOptions: {
                                    maxZoomLevel: "decade",
                                    minZoomLevel: "decade",
                                    // zoomLevel: "year",
                                },
                                displayFormat: "year",
                                placeholder: "Năm thực hiện",
                                showClearButton: true,
                                type: "date",
                            },
                            editorType: "dxDateBox",
                            label: {
                                text: "Năm thực hiện",
                            },
                            validationRules: [{
                                message: "Vui lòng chọn năm thực hiện",
                                type: "required"
                            }],
                        }, {
                            dataField: "nhathau",
                            editorOptions: {
                                dataSource: self.nhaThauStore,
                                displayExpr: "value",
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
                                valueExpr: "code",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Nhà thầu",
                            },
                            // validationRules: [{
                            //     message: "Vui lòng chọn nhà thầu",
                            //     type: "required"
                            // }],
                            visible: self.loaiKiemTra === "CAYXANH",
                        }, {
                            template: (itemData, itemElement) => {
                                this.dxAttachmentUpload = $(itemElement)
                                    .dxFileUploader({
                                        accept: ".xls, .xlsx",
                                        height: "auto",
                                        labelText: "Hoặc kéo thả tệp vào đây",
                                        multiple: false,
                                        name: "files",
                                        onValueChanged: function (e) {
                                            if (e.value.length) {
                                                file = e.value[0];
                                            }
                                        },
                                        readyToUploadMessage: "Đã sẵn sàng tải lên",
                                        selectButtonText: "Chọn tệp",
                                        uploadFailedMessage: "Tải lên thất bại",
                                        uploadMethod: "POST",
                                        uploadMode: "useForm",
                                        uploadedMessage: "Tải lên thành công"
                                    }).dxFileUploader("instance");
                            }
                        }, {
                            template: () => {
                                return "<hr style=\"margin: 5px 0;\" />";
                            }
                        }, {
                            template: (itemData, itemElement) => {
                                $("<div />").appendTo(itemElement)
                                    .dxToolbar({
                                        items: [{
                                            location: "center",
                                            options: {
                                                onClick: () => {
                                                    switch (this.loaiKiemTra) {
                                                        case EnumMap.CAYXANH.text:
                                                            OGUtils.postDownload("/api/kiem-tra/ke-hoach/cay-xanh/template", {}, "application/json");
                                                            break;
                                                        case EnumMap.THOATNUOC.text:
                                                            OGUtils.postDownload("/api/kiem-tra/ke-hoach/thoat-nuoc/template", {}, "application/json");
                                                            break;
                                                        case EnumMap.CHIEUSANG.text:
                                                            OGUtils.postDownload("/api/kiem-tra/ke-hoach/chieu-sang/template", {}, "application/json");
                                                            break;
                                                        // case EnumMap.CHIEUSANG.text:
                                                        //     OGUtils.postDownload("/api/kiem-tra/ke-hoach/chieu-sang/template", {}, "application/json");
                                                        //     break;
                                                        default:
                                                            break;
                                                    }

                                                },
                                                stylingMode: "contained",
                                                text: "Tải về biểu mẫu",
                                                type: "success"
                                            },
                                            widget: "dxButton"
                                        }, {
                                            location: "center",
                                            options: {
                                                onClick: () => {
                                                    const validate = self.importForm.validate();
                                                    if (validate && validate.brokenRules.length === 0) {
                                                        const nam_kehoach: string = (self.importForm.option("formData")["thoigian"] as Date).getFullYear().toString();

                                                        if (file && self.importPopup["id"]) {
                                                            OGUtils.showLoading();

                                                            const formData = new FormData();
                                                            formData.append("nam_kehoach", nam_kehoach);
                                                            if (self.importForm.option("formData")["nhathau"]) {
                                                                const nhathau: string = self.importForm.option("formData")["nhathau"];
                                                                formData.append("nhathau", nhathau);
                                                            }

                                                            formData.append("file", file);
                                                            formData.append("kehoach_id", self.importPopup["id"]);
                                                            const xhr = new XMLHttpRequest();
                                                            xhr.open("POST", "/api/kiem-tra/ke-hoach/import", true);
                                                            xhr.responseType = "json";
                                                            xhr.onload = function () {
                                                            };
                                                            xhr.onloadend = () => {
                                                                OGUtils.hideLoading();
                                                                if (xhr.response.status == "OK") {
                                                                    OGUtils.alert("Thao tác thành công!");
                                                                    this.importPopup.hide();
                                                                } else {
                                                                    OGUtils.alert(xhr.response.errors[0].message, "Lỗi");
                                                                }
                                                            };
                                                            xhr.send(formData);
                                                        }
                                                        else {
                                                            OGUtils.error("Vui lòng chọn tệp dữ liệu!");
                                                        }
                                                    }
                                                },
                                                stylingMode: "contained",
                                                text: "Nhập dữ liệu",
                                                type: "default"
                                            },
                                            widget: "dxButton"
                                        }, {
                                            location: "center",
                                            options: {
                                                onClick: () => {
                                                    this.importPopup.hide();
                                                },
                                                stylingMode: "contained",
                                                text: "Hủy",
                                                type: "danger"
                                            },
                                            widget: "dxButton"
                                        }]
                                    });
                            }
                        }
                    ],
                    labelLocation: "left",
                    // minColWidth: 300,
                    showColonAfterLabel: true,
                    width: "100%",
                }).dxForm("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: "auto",
            hideOnOutsideClick: false,
            onHiding: () => {
                self.importForm.option("formData", {});
                self.dxAttachmentUpload.reset();
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
            title: "Nhập từ file excel",
            width: 500,
        }).dxPopup("instance");
    }

    private initKetQuaPopup(): void {
        const self = this;
        this.ketQuaPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                container.css("padding", "10px");
                this.resultGrid = $("<div />").appendTo(container).dxDataGrid({
                    allowColumnReordering: true,
                    allowColumnResizing: true,
                    columnChooser: {
                        enabled: false,
                        mode: "select",
                    },
                    columns: [{
                        alignment: "center",
                        caption: "STT",
                        cellTemplate: (container, options) => {
                            const pageIndex = this.resultGrid.pageIndex();
                            const pageSize = this.resultGrid.pageSize();
                            container.append((pageSize * pageIndex) + options.row["dataIndex"] + 1);
                        },
                        dataField: "index",
                        visible: false,
                        width: 50
                    }, {
                        caption: "Tên",
                        dataField: "tenkehoach",
                    }, {
                        caption: "Địa điểm",
                        dataField: "diadiemthuchien",
                    }, {
                        caption: "Ngày bắt đầu thực hiện",
                        dataField: "ngaybatdau",
                        dataType: "date",
                        format: "dd/MM/yyyy",
                    }, {
                        caption: "Ngày kết thúc thực hiện",
                        dataField: "ngayketthuc",
                        dataType: "date",
                        format: "dd/MM/yyyy",
                    }, {
                        caption: "Tình trạng",
                        cellTemplate: (container, options) => {
                            container.append(options.data["ngayketthuc"] ? "Đã hoàn thành" : "Chưa hoàn thành");
                        },
                        dataField: null
                    },],
                    dataSource: {
                        store: this.maintenancePlanStore
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
                                hint: "Làm mới",
                                icon: "icon icon-refresh",
                                onClick: () => {
                                    this.resultGrid.getDataSource().reload();
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
            },
            deferRendering: false,
            dragEnabled: false,
            height: "100%",
            hideOnOutsideClick: false,
            onHiding: () => {
            },
            onOptionChanged: () => {
            },
            onShown: (e) => {
                self.resultGrid.getDataSource().reload();
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
            title: "Thông tin kết quả kiểm tra",
            width: "100%",
        }).dxPopup("instance");
    }
    private initLayout(): void {
        this.arguments = {};
        this.maintenancePlanStore = new CustomStore({
            byKey: (key) => {
                return KeHoachKiemTraService.get(key);
            },
            insert: (values) => {
                values.loaikehoach = this.loaiKiemTra;
                const def = $.Deferred();
                KeHoachKiemTraService.insert(values).then(result => {
                    if (result && result.status === EnumStatus.OK) {
                        OGUtils.alert("Lưu kế hoạch duy tu, duy trì thành công", "Thành công");
                        this.maintenancePlanGrid.getDataSource().reload();
                        this.maintenancePlanPopup.hide();
                        def.resolve();
                    } else {
                        OGUtils.error("Đã xảy ra lỗi, vui lòng kiểm tra lại");
                        def.reject();
                    }
                });
                return def.promise();
            },
            key: "id",
            load: (loadOptions) => {
                const deferred = $.Deferred();

                if (loadOptions.sort) {
                    this.arguments["orderby"] = loadOptions.sort[0].selector;
                    if (loadOptions.sort[0].desc)
                        this.arguments["orderby"] += " desc";
                }
                this.arguments["skip"] = loadOptions.skip ? loadOptions.skip : 0;
                this.arguments["take"] = loadOptions.take ? loadOptions.take : 50;
                this.arguments["loaikiemtra"] = this.loaiKiemTra;
                if (this.arguments) {
                    KeHoachKiemTraService.list(this.arguments).then(result => {
                        if (result && result.data.length > 0) {
                            let counter = this.arguments["skip"] + 1;
                            result.data.forEach(x => {
                                x["counter"] = counter++;
                            });
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
                } else {
                    deferred.resolve({
                        data: [],
                        totalCount: 0
                    });
                }
                return deferred.promise();
            },
            remove: (key) => {
                return KeHoachKiemTraService.delete({ id: key });
            },
            update: (key, values: OGKeHoachKiemTraModel) => {
                values.loaikehoach = this.loaiKiemTra;
                const def = $.Deferred();
                KeHoachKiemTraService.update(values).then(result => {
                    if (result && result.status === EnumStatus.OK) {
                        OGUtils.alert("Lưu kế hoạch duy tu, duy trì thành công", "Thành công");
                        this.maintenancePlanGrid.getDataSource().reload();
                        this.maintenancePlanPopup.hide();
                        def.resolve();
                    } else {
                        OGUtils.error("Đã xảy ra lỗi, vui lòng kiểm tra lại");
                        def.reject();
                    }
                });
                return def.promise();
            }
        });

        this.nhanVienStore = new CustomStore({
            key: "id",
            load: () => {
                const deferred = $.Deferred();
                const args = {};
                args["loainhanvien_id"] = this.loaiNhanVienId;

                NhanVienService.list(args).then(result => {
                    deferred.resolve(result.data);
                });
                return deferred.promise();
            },
            loadMode: "raw"
        });
        this.nhaThauStore = new CustomStore({
            key: "code",
            load: () => {
                const deferred = $.Deferred();
                const args = {};

                $.get("/api/ke-hoach/nha-thau/list?loaiKeHoach=" + this.loaiKiemTra).then(xhr => {
                    if (xhr && xhr.status === EnumStatus.OK) {
                        console.log(xhr.data);
                        deferred.resolve(xhr.data);
                    } else {
                        deferred.resolve([]);
                    }
                });
                return deferred.promise();
            },
            loadMode: "raw"
        });
        this.initMaintenance(this.container);
        this.initCongTrinhBaoDuong();
        this.initKetQuaPopup();
        this.initGiaoViecNhanVien();
        this.initBaoCaoTongHopPopup();
        this.initImportPopup();
    }
    private initMaintenance(container): void {
        const self = this;
        //Popup thêm kế hoạch kiểm tra
        this.maintenancePlanPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                container.css("padding", "10px");
                const row = $("<div />").appendTo(container).height("100%");
                this.maintenancePlanFormContainer = $("<div />").appendTo(row).height("100%").css({
                    "float": "left",
                    "padding-right": "10px",
                    "width": "500px"
                });
                this.maintenancePlanFormContainer.append("<p class=\"maintenance-title\">B1 : Điền thông tin kế hoạch</p>");

                this.columnRightContainer = $("<div />").appendTo(row).css({
                    "border-left": "1px solid #ddd",
                    "height": "calc(100% - 50px)",
                    "margin-left": "500px",
                    "padding-left": "5px"
                });

                this.congTrinhBaoDuongGridContainer = $("<div />").appendTo(this.columnRightContainer).height("500px");
                this.congViecGridContainer = $("<div />").appendTo(this.columnRightContainer).height("500px");
                this.giaoViecNhanVienGridContainer = $("<div />").appendTo(this.columnRightContainer).height("300px");

                // this.tepDinhKemGridContainer = $("<div />").appendTo(this.columnRightContainer).height("300px");

                this.toolbarFormContainer = $("<div />").appendTo(row).css("padding", "10px").css("float", "right");

                //Form thông tin chung
                this.maintenancePlanForm = $("<form />").appendTo(this.maintenancePlanFormContainer)
                    .dxForm({
                        height: "100%",
                        items: [{
                            dataField: "id",
                            visible: false
                        }, {
                            dataField: "tenkehoach",
                            editorOptions: {
                                placeholder: "Tên kế hoạch",
                                showClearButton: true,
                            },
                            editorType: "dxTextBox",
                            label: {
                                text: "Tên kế hoạch",
                            },
                            validationRules: [{
                                message: "Vui lòng nhập tên kế hoạch kiểm tra",
                                type: "required"
                            }]
                        }, {
                            dataField: "diadiemthuchien",
                            editorOptions: {
                                placeholder: "Địa điểm thực hiện",
                                showClearButton: true,
                            },
                            editorType: "dxTextArea",
                            label: {
                                text: "Địa điểm thực hiện",
                            },
                            validationRules: [{
                                message: "Vui lòng nhập địa điểm thực hiện kiểm tra",
                                type: "required"
                            }]
                        }, {
                            dataField: "noidung",
                            editorOptions: {
                                placeholder: "Nội dung thực hiện",
                                showClearButton: true,
                            },
                            editorType: "dxTextArea",
                            label: {
                                text: "Nội dung thực hiện",
                            },
                        }, {
                            dataField: "magoithau",
                            editorOptions: {
                                dataSource: new CustomStore({
                                    key: "magoithau",
                                    load: () => {
                                        const deferred = $.Deferred();

                                        $.get("/api/ke-hoach/goi-thau/list?loaiKeHoach=" + self.loaiKiemTra).then(xhr => {
                                            if (xhr && xhr.status === EnumStatus.OK) {
                                                deferred.resolve(xhr.data);
                                            } else {
                                                deferred.resolve([]);
                                            }
                                        });

                                        return deferred.promise();
                                    },
                                    loadMode: "raw"
                                }),
                                displayExpr: "tengoithau",
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
                                valueExpr: "magoithau",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Gói thầu",
                            },
                        }, {
                            dataField: "mahopdong",
                            editorOptions: {
                                placeholder: "Hợp đồng",
                                showClearButton: true,
                            },
                            editorType: "dxTextBox",
                            label: {
                                text: "Hợp đồng",
                            },
                        }, {
                            dataField: "nguoilapkehoach",
                            editorOptions: {
                                placeholder: "Người lập kế hoạch",
                                showClearButton: true,
                            },
                            editorType: "dxTextBox",
                            label: {
                                text: "Người lập kế hoạch",
                            },
                        }, {
                            colCount: 2,
                            itemType: "group",
                            items: [{
                                dataField: "ngaybatdau",
                                editorOptions: {
                                    dateSerializationFormat: "yyyy-MM-ddTHH:mm:ss",
                                    displayFormat: "dd/MM/yyyy",
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
                                        const endDate = self.maintenancePlanForm.getEditor("ngayketthuc").option("value");
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
                                }, {
                                    message: "Vui lòng nhập thời gian bắt đầu thực hiện công việc",
                                    type: "required"
                                }]
                            }, {
                                dataField: "ngayketthuc",
                                editorOptions: {
                                    dateSerializationFormat: "yyyy-MM-ddTHH:mm:ss",
                                    displayFormat: "dd/MM/yyyy",
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
                                        const startDate = self.maintenancePlanForm.getEditor("ngaybatdau").option("value");
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
                            }]
                        }, {
                            dataField: "ghichu",
                            editorOptions: {
                                placeholder: "Ghi chú",
                                showClearButton: true,
                            },
                            editorType: "dxTextArea",
                            label: {
                                text: "Ghi chú",
                            },
                        }, {
                            dataField: "uploadFile",
                            label: {
                                showColon: false,
                                text: " ",
                            },
                            template: (itemData, itemElement) => {
                                // itemElement.css("padding", "unset");
                                this.dxAttachmentUpload = $(itemElement)
                                    .dxFileUploader({
                                        accept: "image/jpeg,image/gif,image/png,application/pdf,image/x-eps,.pdf, .xls, .xlsx, .doc, .docx,.zip, .rar",
                                        height: "auto",
                                        labelText: "Hoặc kéo thả tệp vào đây",
                                        multiple: true,
                                        name: "files",
                                        onValueChanged: function (e) {
                                            const files = e.value;
                                            if (files.length > 0) {
                                                files.forEach(file => {
                                                    const attachment = {
                                                        file: file,
                                                        file_name: file.name,
                                                        id: 0,
                                                        kehoach_id: 0,
                                                        mime_type: file.type,
                                                        size: file.size,
                                                        url: "/"
                                                    } as OGKeHoachKiemTraDinhKemModel;
                                                    self.tepDinhKemDatasource.push(attachment);
                                                });
                                                self.fileList.getDataSource().reload();
                                                self.dxAttachmentUpload.reset();
                                            }
                                        },
                                        readyToUploadMessage: "Đã sẵn sàng tải lên",
                                        selectButtonText: "Chọn tệp",
                                        uploadFailedMessage: "Tải lên thất bại",
                                        uploadMethod: "POST",
                                        uploadMode: "useForm",
                                        uploadedMessage: "Tải lên thành công"
                                    }).dxFileUploader("instance");
                            }
                        },
                        {
                            cssClass: "attachments-container",
                            label: {
                                text: "Tệp đính kèm",
                            },
                            template: (itemData, itemElement) => {
                                itemElement.css("margin", "auto");
                                this.fileList = $(itemElement)
                                    .dxList({
                                        dataSource: {
                                            store: new CustomStore({
                                                load: (loadOptions) => {
                                                    return self.tepDinhKemDatasource;
                                                },
                                            })
                                        },
                                        itemTemplate: (itemData, itemIndex, childElement) => {
                                            const container = $(childElement).css("padding", "0 10px")
                                                .dxToolbar({
                                                    items: [{
                                                        location: "before",
                                                        template: function () {
                                                            return itemData.file_name;
                                                        }
                                                    },
                                                    {
                                                        location: "after",
                                                        options: {
                                                            icon: "trash",
                                                            onClick: (e) => {
                                                                OGUtils.confirm("Bạn có muốn xóa tệp đính kèm này").then(value => {
                                                                    if (value) {
                                                                        if (itemIndex < self.tepDinhKemDatasource.length) {
                                                                            self.tepDinhKemDatasource.splice(itemIndex, 1);
                                                                            self.fileList.getDataSource().reload();
                                                                        }
                                                                    }
                                                                });
                                                            },
                                                            type: "danger"
                                                        },
                                                        visible: itemData.allowedDelete,
                                                        widget: "dxButton"
                                                    },]
                                                }).dxToolbar("instance");
                                            return container;
                                        },
                                        pageLoadMode: "scrollBottom"
                                    })
                                    .dxList("instance");
                            }
                        },],
                        labelLocation: "top",
                        scrollingEnabled: false,
                    }).dxForm("instance");

                this.maintenancePlanFormContainer.dxScrollView({
                    height: "100%",
                    showScrollbar: "always"
                });

                //Grid thiết bị sửa chữa, bảo trì
                this.congTrinhBaoDuongGrid = $("<div />").appendTo(this.congTrinhBaoDuongGridContainer).dxDataGrid({
                    allowColumnReordering: true,
                    allowColumnResizing: true,
                    columns: [{
                        alignment: "center",
                        caption: "STT",
                        cellTemplate: (container, options) => {
                            const pageIndex = this.congTrinhBaoDuongGrid.pageIndex();
                            const pageSize = this.congTrinhBaoDuongGrid.pageSize();
                            container.append((pageSize * pageIndex) + options.row["dataIndex"] + 1);
                        },
                        dataField: "index",
                        width: 50,
                    }, {
                        caption: "Loại công trình",
                        dataField: "table_name",
                        groupCellTemplate: (cellElement, cellInfo) => {
                            cellElement.html(cellInfo.displayValue);
                        },
                        groupIndex: 0
                    }, {
                        caption: "Tuyến/Tài sản",
                        dataField: "feature_name"
                    }, {
                        alignment: "center",
                        allowEditing: false,
                        caption: "Thao tác",
                        cellTemplate: (container, options) => {
                            $("<div>").appendTo(container).dxToolbar({
                                items: [{
                                    location: "center",
                                    options: {
                                        hint: "Xóa thiết bị, công trình khỏi kế hoạch kiểm tra",
                                        icon: "icon icon-trash",
                                        onClick: () => {
                                            OGUtils.confirm("Bạn muốn thiết bị, công trình này khỏi kế hoạch kiểm tra?").then(value => {
                                                if (value) {
                                                    self.congTrinhBaoDuongDataSource = $.grep(self.congTrinhBaoDuongDataSource, function (congTrinh) {
                                                        return (congTrinh.feature_id != options.data.feature_id) && (congTrinh.table_id != options.data.table_id);
                                                    });
                                                    self.congTrinhBaoDuongGrid.option("dataSource", self.congTrinhBaoDuongDataSource);
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
                    dataSource: self.congTrinhBaoDuongDataSource,
                    errorRowEnabled: false,
                    height: "100%",
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
                            location: "before",
                            template: () => {
                                return "<p class=\"maintenance-title\">B2: Chọn tuyến, tài sản cần duy tu theo kế hoạch</p>";
                            }
                        }, {
                            location: "after",
                            options: {
                                hint: "Thêm tuyến/tài sản",
                                icon: "icon icon-add",
                                onClick: () => {
                                    this.congTrinhBaoDuongPopup.show();
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
                    remoteOperations: {
                        filtering: false,
                        groupPaging: false,
                        grouping: false,
                        paging: true,
                        sorting: false,
                        summary: false
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

                //Grid công việc
                this.congViecGrid = $("<div />").appendTo(this.congViecGridContainer).dxDataGrid({
                    allowColumnReordering: true,
                    allowColumnResizing: true,
                    columns: [{
                        alignment: "center",
                        allowEditing: false,
                        caption: "STT",
                        cellTemplate: (container, options) => {
                            const pageIndex = this.congViecGrid.pageIndex();
                            const pageSize = this.congViecGrid.pageSize();
                            container.append((pageSize * pageIndex) + options.row["dataIndex"] + 1);
                        },
                        dataField: "index",
                        width: 50,
                    }, {
                        caption: "Hạng mục công việc",
                        dataField: "congviec_id",
                        groupCellTemplate: (cellElement, cellInfo) => {
                            cellElement.html(cellInfo.displayValue);
                        },
                        lookup: {
                            dataSource: {
                                store: new CustomStore({
                                    byKey: (key) => {
                                        return new Promise((resolve, reject) => {
                                            DmHangMucCongViecService.get(key).then(data => {
                                                resolve(data);
                                            });
                                        });
                                    },
                                    load: (loadOptions) => {
                                        return new Promise((resolve, reject) => {
                                            KeHoachKiemTraService.listCongViec(this.loaiKiemTra).then(data => {
                                                resolve({
                                                    data: data,
                                                    totalCount: data.length,
                                                });
                                            });
                                        });
                                    }
                                })
                            },
                            displayExpr: "value",
                            valueExpr: "id",
                        },
                        width: 200,
                    },
                    {
                        allowEditing: self.loaiKiemTra === "CAYXANH",
                        caption: "Nhà thầu",
                        dataField: "nhathau",
                        groupCellTemplate: (cellElement, cellInfo) => {
                            cellElement.html(cellInfo.displayValue);
                        },
                        lookup: {
                            dataSource: {
                                store: self.nhaThauStore
                            },
                            displayExpr: "value",
                            valueExpr: "code",
                        },
                        visible: self.loaiKiemTra === "CAYXANH",
                        width: 200,
                    }, {
                        caption: "Thời gian thực hiện",
                        dataField: "thoigian_thuchien",
                        dataType: "date",
                        editorOptions: {
                            zoomLevel: "year"
                        },
                        width: 120
                    }, {
                        caption: "Khối lượng kế hoạch",
                        dataField: "khoiluong_kehoach",
                        dataType: "number",
                        width: 100
                    }, {
                        caption: "Khối lượng thực hiện",
                        dataField: "khoiluong_thuchien",
                        dataType: "number",
                        width: 100
                    },
                        // {
                        //     caption: "Đơn giá (đã gồm VAT)",
                        //     dataField: "don_gia",
                        //     dataType: "number",
                        //     width: 100
                        // },
                        // {
                        //     caption: "Đơn vị",
                        //     dataField: "donvi",
                        //     width: 80
                        // }
                    ],
                    dataSource: self.congViecDatasource,
                    editing: {
                        allowAdding: true,
                        allowDeleting: true,
                        allowUpdating: true,
                        mode: "batch",
                        selectTextOnEditStart: true,
                        startEditAction: "click",
                    },
                    errorRowEnabled: false,
                    height: "100%",
                    keyExpr: "id",
                    onContentReady: (e) => {
                        e.element.find(".dx-datagrid-header-panel").css("padding-top", "0").css("margin", "0");
                    },
                    onRowUpdating: function (options) {
                        // $.extend(options.newData, $.extend({}, options.oldData, options.newData));
                    },
                    onToolbarPreparing: (e) => {
                        e.toolbarOptions.items.unshift({
                            location: "before",
                            template: () => {
                                return "<p class=\"maintenance-title\">B3: Khối lượng cần duy tu theo kế hoạch</p>";
                            }
                        }, {
                            location: "after",
                            options: {
                                hint: "Thêm khối lượng",
                                icon: "icon icon-add",
                                onClick: () => {
                                    this.congViecGrid.addRow();
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

                // Grid nhân viên
                this.giaoViecNhanVienGrid = $("<div />").appendTo(this.giaoViecNhanVienGridContainer).dxDataGrid({
                    allowColumnReordering: true,
                    allowColumnResizing: false,
                    columns: [{
                        alignment: "center",
                        caption: "STT",
                        cellTemplate: (container, options) => {
                            const pageIndex = this.giaoViecNhanVienGrid.pageIndex();
                            const pageSize = this.giaoViecNhanVienGrid.pageSize();
                            container.append((pageSize * pageIndex) + options.row["dataIndex"] + 1);
                        },
                        dataField: "index",
                        width: 50,
                    }, {
                        dataField: "phieugiamsat_id",
                        visible: false,
                    }, {
                        caption: "Tên nhân viên",
                        dataField: "nhanvien_id",
                        lookup: {
                            dataSource: {
                                store: this.nhanVienStore,
                            },
                            displayExpr: "tennhanvien",
                            valueExpr: "id",
                        },
                    }, {
                        caption: "Ghi chú",
                        dataField: "ghichu",
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
                                            this.giaoViecNhanVienGrid.editRow(options.rowIndex);
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
                                            OGUtils.confirm("Bạn muốn xóa nhân viên này khỏi kế hoạch kiểm tra?").then(value => {
                                                if (value) {
                                                    const index = self.giaoViecNhanVienDatasource.indexOf(options.data);
                                                    if (index > -1) { // only splice array when item is found
                                                        self.giaoViecNhanVienDatasource.splice(index, 1); // 2nd parameter means remove one item only
                                                    }
                                                    this.giaoViecNhanVienGrid.beginUpdate();
                                                    this.giaoViecNhanVienGrid.option("dataSource", self.giaoViecNhanVienDatasource);
                                                    this.giaoViecNhanVienGrid.endUpdate();
                                                    // options.component.getDataSource().store().remove(options.data.id).then(() => {
                                                    //     self.giaoViecNhanVienDatasource = options.component.getDataSource().items();
                                                    //     options.component.getDataSource().reload();
                                                    // });
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
                    dataSource: self.giaoViecNhanVienDatasource,
                    editing: {
                        form: {
                            colCount: 1,
                            items: [{
                                dataField: "nhanvien_id"
                            }, {
                                dataField: "ghichu",
                            },]
                        },
                        mode: "popup",
                        popup: {
                            height: "auto",
                            showTitle: true,
                            title: "Phân công cho nhân viên",
                            width: "500"
                        },
                        texts: {
                            cancelRowChanges: "Hủy",
                            saveRowChanges: "Lưu",
                        },
                        useIcons: false
                    },
                    errorRowEnabled: false,
                    height: "100%",
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
                            location: "before",
                            template: () => {
                                return "<p class=\"maintenance-title\">B4: Giao việc cho nhân viên</p>";
                            }
                        }, {
                            location: "after",
                            options: {
                                hint: "Thêm nhân viên thực hiện kiểm tra",
                                icon: "icon icon-add",
                                onClick: () => {
                                    self.giaoViecNhanVienPopup.show();
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
                    remoteOperations: {
                        filtering: false,
                        groupPaging: false,
                        grouping: false,
                        paging: true,
                        sorting: false,
                        summary: false
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

                this.columnRightContainer.dxScrollView({
                    height: "calc(100% - 50px)",
                    showScrollbar: "always"
                });

                this.maintenancePlanFormToolbar = $("<div>").appendTo(this.toolbarFormContainer).dxToolbar({
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
                                this.maintenancePlanPopup.hide();
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
            dragEnabled: true,
            height: 600,
            hideOnOutsideClick: false,
            onContentReady: () => {
            },
            onHiding: () => {
                self.refreshMaintenancePlanForm();
            },
            onShowing: () => {
            },
            position: {
                at: "center",
                my: "center",
                of: window
            },
            resizeEnabled: true,
            shading: false,
            showCloseButton: true,
            showTitle: true,
            title: "Lập kế hoạch duy tu, duy trì",
            toolbarItems: [{
                location: "after",
                options: {
                    hint: "Thu nhỏ",
                    icon: "chevronup",
                    onClick: function (e) {
                        if (e.component.option("icon") == "chevrondown") {
                            self.maintenancePlanPopup.option("height", 600);
                            e.component.option("icon", "chevronup");
                            e.component.option("hint", "Thu nhỏ");
                        } else {
                            self.maintenancePlanPopup.option("height", 90);
                            e.component.option("icon", "chevrondown");
                            e.component.option("hint", "Mở rộng");
                        }
                    },
                    stylingMode: "text",
                    type: "normal",
                },
                widget: "dxButton",
            }, {
                location: "after",
                options: {
                    hint: "Toàn màn hình",
                    icon: "expandform",
                    onClick: function (e) {
                        if (e.component.option("icon") == "expandform") {
                            self.maintenancePlanPopup.option("position", { at: "center", my: "center", of: window });
                            self.maintenancePlanPopup.option("height", "100vh");
                            self.maintenancePlanPopup.option("width", "100vw");
                            e.component.option("icon", "fullscreen");
                            e.component.option("hint", "Mặc định");
                        } else {
                            self.maintenancePlanPopup.option("position", { boundaryOffset: { x: 0, y: 0 } });
                            self.maintenancePlanPopup.option("height", 600);
                            self.maintenancePlanPopup.option("width", 1100);
                            e.component.option("icon", "expandform");
                            e.component.option("hint", "Toàn màn hình");
                        }
                    },
                    stylingMode: "text",
                    type: "normal"
                },
                widget: "dxButton"
            }],
            width: $(document).width() > 1100 ? 1100 : "80%"
        }).dxPopup("instance");

        this.maintenancePlanGrid = $("<div />").appendTo(container).dxDataGrid({
            allowColumnReordering: true,
            allowColumnResizing: true,
            columnChooser: {
                enabled: false,
                mode: "select",
            },
            columns: [{
                alignment: "center",
                caption: "STT",
                cellTemplate: (container, options) => {
                    const pageIndex = this.maintenancePlanGrid.pageIndex();
                    const pageSize = this.maintenancePlanGrid.pageSize();
                    container.append((pageSize * pageIndex) + options.row["dataIndex"] + 1);
                },
                dataField: "index",
                visible: false,
                width: 50
            }, {
                caption: "Tên",
                dataField: "tenkehoach",
            }, {
                caption: "Địa điểm",
                dataField: "diadiemthuchien",
            }, {
                alignment: "center",
                allowEditing: false,
                caption: "Thao tác",
                cellTemplate: (container, options) => {
                    $("<div>").appendTo(container).dxDropDownButton({
                        displayExpr: "text",
                        dropDownOptions: {
                            width: 200
                        },
                        hint: "Thao tác",
                        icon: "icon icon-setting-2",
                        items: [
                            {
                                hint: "Xuất khối lượng kế hoạch duy tu, duy trì",
                                icon: "icon icon-import",
                                onClick: () => {
                                    if (this.loaiKiemTra === "CAYXANH" || this.loaiKiemTra === "THOATNUOC" || this.loaiKiemTra === "CHIEUSANG") {
                                        self.importPopup["id"] = options.data.id;
                                        self.importPopup.show();
                                    }
                                },
                                text: "Nhập KL kế hoạch"
                            },
                            {
                                hint: "Xuất khối lượng kế hoạch duy tu, duy trì",
                                icon: "icon icon-export-excel",
                                onClick: () => {
                                    if (this.loaiKiemTra === "CAYXANH") {
                                        OGUtils.postDownload("/api/kiem-tra/ke-hoach/cay-xanh/excel", options.data, "application/json");
                                    } else if (this.loaiKiemTra === "THOATNUOC") {
                                        OGUtils.postDownload("/api/kiem-tra/ke-hoach/thoat-nuoc/excel", options.data, "application/json");
                                    } else if (this.loaiKiemTra === "CHIEUSANG") {
                                        OGUtils.postDownload("/api/kiem-tra/ke-hoach/chieu-sang/excel", options.data, "application/json");
                                    }
                                },
                                text: "Xuất KL kế hoạch"
                            },
                            {
                                hint: "Cập nhật kế hoạch duy tu, duy trì",
                                icon: "icon icon-edit-2",
                                onClick: () => {
                                    options.component.getDataSource().store().byKey(options.data.id).then(data => {
                                        self.bindMaintenancePlan(data);
                                    });

                                    self.maintenancePlanPopup.option("title", "Cập nhật kế hoạch duy tu, duy trì");
                                    self.maintenancePlanPopup.show();
                                },
                                text: "Cập nhật kế hoạch"
                            }, {
                                hint: "Xóa kế hoạch duy tu, duy trì",
                                icon: "icon icon-trash",
                                onClick: () => {
                                    OGUtils.confirm("Bạn muốn xóa kế hoạch duy tu, duy trì này?").then(value => {
                                        if (value) {
                                            options.component.getDataSource().store().remove(options.data.id).then(() => {
                                                options.component.getDataSource().reload();
                                            });
                                        }
                                    });
                                },
                                text: "Xóa kế hoạch"
                            }],
                        stylingMode: "contained",
                        visible: this.loaiKiemTra == EnumMap.CAYXANH.text || this.loaiKiemTra == EnumMap.THOATNUOC.text || this.loaiKiemTra == EnumMap.CHIEUSANG.text,
                    });
                },
                dataField: "id",
                width: 80,
            }],
            dataSource: {
                store: this.maintenancePlanStore
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
                    location: "before",
                    options: {
                        hint: "Thông tin kết quả kiểm tra",
                        icon: "icon icon-chart-success",
                        onClick: () => {
                            self.ketQuaPopup.show();
                        },
                        type: "success"
                    },
                    widget: "dxButton"
                }, {
                    location: "before",
                    options: {
                        hint: "Báo cáo tổng hợp kết quả kiểm tra",
                        icon: "icon icon-archive-book",
                        onClick: () => {
                            self.baoCaoTongHopPopup.show();
                        },
                        type: "success"
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        hint: "Xuất danh sách kế hoạch duy tu, duy trì",
                        icon: "icon icon-ram",
                        onClick: () => {
                            OGUtils.postDownload("/api/khu-do-thi/kiem-tra/export", self.arguments);
                        },
                        type: "success"
                    },
                    visible: false,
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        hint: "Lập kế hoạch duy tu, duy trì",
                        icon: "icon icon-add",
                        onClick: () => {
                            self.refreshMaintenancePlanForm();
                            self.maintenancePlanPopup.option("title", "Lập kế hoạch duy tu, duy trì");
                            self.maintenancePlanPopup.show();
                        },
                        type: "default"
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        icon: "icon icon-search-normal-1",
                        onValueChanged: (e) => {
                            self.arguments["key"] = e.value;
                            self.maintenancePlanGrid.getDataSource().reload();
                        },
                        placeholder: "Từ khóa",
                        width: 200
                    },
                    visible: false,
                    widget: "dxTextBox"
                }, {
                    location: "after",
                    options: {
                        hint: "Làm mới",
                        icon: "icon icon-refresh",
                        onClick: () => {
                            this.maintenancePlanGrid.getDataSource().reload();
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
    }
    private refreshMaintenancePlanForm(): void {
        this.maintenancePlanForm.option("formData", {});
        this.congTrinhBaoDuongDataSource = [];
        this.congTrinhBaoDuongGrid.option("dataSource", []);
        this.giaoViecNhanVienDatasource = [];
        this.giaoViecNhanVienGrid.option("dataSource", []);
        this.tepDinhKemDatasource = [];
        this.congViecDatasource = [];
        this.congViecGrid.option("dataSource", []);
        this.fileList.getDataSource().reload();
    }

    private save(): void {
        const self = this;
        const validate = self.maintenancePlanForm.validate();
        if (validate && validate.brokenRules.length === 0) {
            const data: OGKeHoachKiemTraModel = JSON.parse(JSON.stringify(self.maintenancePlanForm.option("formData")));
            if (data.listCongViec) {
                data.listCongViec.map(element => {
                    if (typeof element.id == "string") {
                        element.id = 0;
                    }
                });
            }
            data.loaikehoach = self.loaiKiemTra;
            data.congTrinhs = self.congTrinhBaoDuongDataSource;
            data.nhanViens = self.giaoViecNhanVienDatasource;
            const promises = [];
            const olds = self.tepDinhKemDatasource.filter(x => x.id > 0);
            if (self.tepDinhKemDatasource.filter(x => x.id == 0).length) {
                const images = self.tepDinhKemDatasource.filter(x => x.id == 0 && x.file !== undefined && x.mime_type.includes("image"));
                if (images.length) {
                    const formData = new FormData();
                    images.forEach(image => {
                        formData.append("chunkContent", image.file);
                    });
                    promises.push(new Promise(function (resolve, reject) {
                        UploadService.images(formData).then(response => {
                            if (response.status === EnumStatus.OK) {
                                (response as RestData<string[]>).data.forEach((path, index) => {
                                    if (images[index]) {
                                        images[index].url = UploadService.MEDIA_PATH + "/" + path;
                                        if (images[index].file) {
                                            delete images[index].file;
                                        }
                                    }
                                });
                                resolve(images);
                            }
                            else {
                                reject([]);
                            }
                        });
                    }));
                }
                const documents = self.tepDinhKemDatasource.filter(x => x.id == 0 && x.file !== undefined && !x.mime_type.includes("image"));
                if (documents.length) {
                    const formData = new FormData();
                    documents.forEach(document => {
                        formData.append("chunkContent", document.file);
                    });
                    promises.push(new Promise(function (resolve, reject) {
                        UploadService.documents(formData).then(response => {
                            if (response.status === EnumStatus.OK) {
                                (response as RestData<string[]>).data.forEach((path, index) => {
                                    if (documents[index]) {
                                        documents[index].url = UploadService.DOCUMENT_PATH + "/" + path;
                                        if (documents[index].file) {
                                            delete documents[index].file;
                                        }
                                    }
                                });
                                resolve(documents);
                            }
                            else {
                                reject([]);
                            }
                        });
                    }));
                }
                if (promises.length) {
                    Promise.all(promises).then(attachments => {
                        if (attachments.length) {
                            self.tepDinhKemDatasource = olds.concat(attachments.flat(1));
                            data.attachments = self.tepDinhKemDatasource;
                            OGUtils.showLoading();
                            if (data.id) {
                                KeHoachKiemTraService.update(data).then(result => {
                                    if (result) {
                                        OGUtils.alert("Lưu kế hoạch kiểm tra thành công", "Thành công");
                                        OGUtils.hideLoading();
                                        this.maintenancePlanGrid.getDataSource().reload();
                                        this.maintenancePlanPopup.hide();
                                    } else {
                                        OGUtils.hideLoading();
                                    }
                                });
                            }
                            else {
                                KeHoachKiemTraService.insert(data).then(result => {
                                    if (result) {
                                        OGUtils.alert("Lưu kế hoạch kiểm tra thành công", "Thành công");
                                        OGUtils.hideLoading();
                                        this.maintenancePlanGrid.getDataSource().reload();
                                        this.maintenancePlanPopup.hide();
                                    } else {
                                        OGUtils.hideLoading();
                                    }
                                });
                            }

                        }
                    });
                }
            }
            else {
                data.attachments = self.tepDinhKemDatasource;
                OGUtils.showLoading();
                if (data.id) {
                    KeHoachKiemTraService.update(data).then(result => {
                        if (result) {
                            OGUtils.alert("Lưu kế hoạch kiểm tra thành công", "Thành công");
                            OGUtils.hideLoading();
                            this.maintenancePlanGrid.getDataSource().reload();
                            this.maintenancePlanPopup.hide();
                        } else {
                            OGUtils.hideLoading();
                        }
                    });
                }
                else {
                    KeHoachKiemTraService.insert(data).then(result => {
                        if (result) {
                            OGUtils.alert("Lưu kế hoạch kiểm tra thành công", "Thành công");
                            OGUtils.hideLoading();
                            this.maintenancePlanGrid.getDataSource().reload();
                            this.maintenancePlanPopup.hide();
                        } else {
                            OGUtils.hideLoading();
                        }
                    });
                }
            }
        }
    }
    onInit(): void {

    }
}

export { MaintenancePlanView };
