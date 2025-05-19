import axios from "axios";
import ArrayStore from "devextreme/data/array_store";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import dxDataGrid from "devextreme/ui/data_grid";
import "devextreme/ui/data_grid";
import dxForm from "devextreme/ui/form";
import "devextreme/ui/form";
import dxList from "devextreme/ui/list";
import dxPopup from "devextreme/ui/popup";
import "devextreme/ui/popup";
import "devextreme/ui/scroll_view";
import "devextreme/ui/tag_box";
import "devextreme/ui/text_area";
import dxToolbar from "devextreme/ui/toolbar";
import Handlebars from "handlebars";
import moment from "moment";

import { IBaseComponent } from "../../../../../../../libs/core/components/base-component.abstract";
import { EnumDanhMuc, EnumStatus } from "../../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../../libs/core/helpers/utils";
import { OGConfigModel } from "../../../../../../../libs/core/models/config.model";
import { OGGiaoViecNhanVienModel, OGHoSoKiemTraModel, OGMaintenanceViewOptions, OGThongTinTraoDoiModel } from "../../../../../../../libs/core/models/kiem-tra/kiem-tra.model";
import { OGPhieuGiamSatKiemTraSuCoModel } from "../../../../../../../libs/core/models/kiem-tra/phieu-kiem-tra-su-co.model";
import { OGMaintenanceFileModel } from "../../../../../../../libs/core/models/maintenance.model";
import { OGNhanVienModel } from "../../../../../../../libs/core/models/nhan-vien.model";
import { CategoryService } from "../../../../../../../libs/core/services/category.service";
import { KiemTraService } from "../../../../../../../libs/core/services/kiem-tra/kiem-tra.service";
import { PhieuKiemTraSuCoService } from "../../../../../../../libs/core/services/kiem-tra/phieu-kiem-tra-su-co.service";
import { NhanVienService } from "../../../../../../../libs/core/services/nhan-vien.service";
import ChatItem from "../../../../templates/maintenances/baoduong_chat_item.hbs";
import DanhSachKiemTraTemp from "../../../../templates/maintenances/danhsach_congviec_kiemtra.hbs";
import PhieuKiemTraTemp from "../../../../templates/maintenances/phieu_kiemtra_cayxanh.hbs";
import SendMessageTmp from "../../../../templates/maintenances/send_message.hbs";

class MaintenanceView implements IBaseComponent {
    anhMinhHoaDataSource: OGHoSoKiemTraModel[];
    anhMinhHoaFileInput: JQuery<HTMLElement>;
    anhMinhHoaGrid: dxDataGrid;
    anhMinhHoaGridContainer: JQuery<HTMLElement>;
    arguments: object;
    chatFiles: OGMaintenanceFileModel[];
    columnRightContainer: JQuery<HTMLElement>;
    config: OGConfigModel;
    congCuKiemTraStore: CustomStore;
    container: JQuery<HTMLElement>;
    deleteAnhMinhHoaIds: number[];
    deleteHoSoQuanLyIds: number[];
    fileChatInput: JQuery<HTMLElement>;
    filterYear: number;
    giaoViecNhanVienDatasource: OGGiaoViecNhanVienModel[];
    giaoViecNhanVienForm: dxForm;
    giaoViecNhanVienGrid: dxDataGrid;
    giaoViecNhanVienGridContainer: JQuery<HTMLElement>;
    giaoViecNhanVienPopup: dxPopup;
    hoSoDataSource: OGHoSoKiemTraModel[];
    hoSoFileInput: JQuery<HTMLElement>;
    hoSoFileList: dxList;
    hoSoForm: dxForm;
    hoSoGrid: dxDataGrid;
    hoSoGridContainer: JQuery<HTMLElement>;
    hoSoListDataSource: OGHoSoKiemTraModel[];
    hoSoPopup: dxPopup;
    loaiHoSoStore: CustomStore;
    loaiKiemTra: string;
    loaiNhanVienId: number;
    maintenanceForm: dxForm;
    maintenanceFormContainer: JQuery<HTMLElement>;
    maintenanceFormToolbar: dxToolbar;
    maintenanceGrid: dxDataGrid;
    maintenanceItemIframe: JQuery<HTMLElement>;
    maintenancePopup: dxPopup;
    maintenanceStore: CustomStore;
    newChats: OGThongTinTraoDoiModel[];
    nhanVienStore: CustomStore<OGNhanVienModel, number>;
    phuongThucKiemTraStore: CustomStore;
    thongTinTraoDoiContainer: JQuery<HTMLElement>;
    thongTinTraoDoiDatasource: OGThongTinTraoDoiModel[];
    thongTinTraoDoiList: dxList;
    toolbarFormContainer: JQuery<HTMLElement>;

    constructor(container: JQuery<HTMLElement>, options: OGMaintenanceViewOptions) {
        this.container = container;
        this.config = options.config;
        this.loaiKiemTra = options.loaiKiemTra;
        this.loaiNhanVienId = options.loaiNhanVienId;
        this.initLayout();
    }
    private bindMaintenance(data: OGPhieuGiamSatKiemTraSuCoModel): void {
        this.maintenanceForm.option("formData", data);
        this.hoSoDataSource = data.hoSoQuanLys;
        this.hoSoGrid.option("dataSource", this.hoSoDataSource);
        this.giaoViecNhanVienDatasource = data.giaoViecNhanViens;
        this.giaoViecNhanVienGrid.option("dataSource", this.giaoViecNhanVienDatasource);
        this.anhMinhHoaDataSource = data.anhMinhHoas;
        this.anhMinhHoaGrid.option("dataSource", this.anhMinhHoaDataSource);
        this.thongTinTraoDoiDatasource = data.thongTinTraoDois;
        this.thongTinTraoDoiList.option("dataSource", this.thongTinTraoDoiDatasource);
    }
    private bindMaintenanceItemIframe(data: OGPhieuGiamSatKiemTraSuCoModel): void {
        this.maintenanceItemIframe[0]["contentWindow"].document.open();
        const content = Handlebars.compile(PhieuKiemTraTemp)(data);
        this.maintenanceItemIframe[0]["contentWindow"].document.write(content);
        this.maintenanceItemIframe[0]["contentWindow"].document.close();
    }
    private initAnhMinhHoa(): void {
        const self = this;
        self.anhMinhHoaFileInput = $("<input type=\"file\" accept=\"image/*\" style=\"display:none !important\" />")
            .appendTo("body")
            .on("change", (e) => {
                for (let i = 0; i < e.target["files"].length; i++) {
                    const file = e.target["files"][i];
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        self.hoSoListDataSource = [];
                        const url = e.target.result;
                        const dataFile: OGHoSoKiemTraModel = {
                            extension: file.name.substring(file.name.lastIndexOf(".")),
                            file: file,
                            file_name: file.name,
                            mime_type: file.type,
                            size: file.size,
                            uid: OGUtils.uuidv4(),
                            url: url.toString()
                        };
                        self.anhMinhHoaDataSource.push(dataFile);
                        self.anhMinhHoaGrid.option("dataSource", self.anhMinhHoaDataSource);
                    };
                    reader.readAsDataURL(file);
                }
            });
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
                        }, {
                            template: (itemData, itemElement) => {
                                $("<div />").appendTo(itemElement)
                                    .dxToolbar({
                                        items: [{
                                            location: "center",
                                            options: {
                                                onClick: () => {
                                                    const validate = self.giaoViecNhanVienForm.validate();
                                                    if (validate && validate.brokenRules.length === 0) {
                                                        const data: OGGiaoViecNhanVienModel = self.giaoViecNhanVienForm.option("formData");
                                                        const existWorker = self.giaoViecNhanVienDatasource.filter(item => item.nhanvien_id === data.nhanvien_id);
                                                        if (existWorker.length === 0) {
                                                            self.giaoViecNhanVienDatasource.push(data);
                                                            self.giaoViecNhanVienGrid.option("dataSource", self.giaoViecNhanVienDatasource);
                                                        } else {
                                                            OGUtils.alert("Nhân viên đã được phân công vào công việc này!", "Thông báo");
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
    private initHoSo(): void {
        const self = this;
        self.hoSoFileInput = $("<input type=\"file\" accept=\"*\" style=\"display:none !important\" />")
            .appendTo("body")
            .on("change", (e) => {
                for (let i = 0; i < e.target["files"].length; i++) {
                    const file = e.target["files"][i];
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        self.hoSoListDataSource = [];
                        const url = e.target.result;
                        const dataFile: OGHoSoKiemTraModel = {
                            extension: file.name.substring(file.name.lastIndexOf(".")),
                            file: file,
                            file_name: file.name,
                            mime_type: file.type,
                            size: file.size,
                            uid: OGUtils.uuidv4(),
                            url: url.toString()
                        };
                        self.hoSoListDataSource.push(dataFile);
                        self.hoSoFileList.option("dataSource", self.hoSoListDataSource);
                    };
                    reader.readAsDataURL(file);
                }
            });

        this.hoSoPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                container.css("padding", "10px");
                //Form thông tin chung
                this.hoSoForm = $("<form />").appendTo(container)
                    .dxForm({
                        height: "100%",
                        items: [{
                            dataField: "id",
                            visible: false
                        }, {
                            dataField: "phieugiamsat_id",
                            visible: false
                        }, {
                            dataField: "loaihoso_id",
                            editorOptions: {
                                dataSource: this.loaiHoSoStore,
                                displayExpr: "mo_ta",
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
                                text: "Loại hồ sơ",
                            },
                            validationRules: [{
                                message: "Vui lòng chọn loại hồ sơ",
                                type: "required"
                            }],
                        }, {
                            template: (itemData, itemElement) => {
                                $("<div />").appendTo(itemElement)
                                    .dxToolbar({
                                        items: [{
                                            location: "before",
                                            options: {
                                                onClick: () => {
                                                    this.hoSoFileInput.trigger("click");
                                                },
                                                stylingMode: "contained",
                                                text: "Nhập file",
                                                type: "default"
                                            },
                                            widget: "dxButton"
                                        }]
                                    });
                            }
                        }, {
                            template: (itemData, itemElement) => {
                                this.hoSoFileList = $("<div />").appendTo(itemElement).dxList({
                                    itemTemplate(data) {
                                        return `<a href=${data.url}>${data.file_name}</a >`;
                                    },
                                    selectionMode: "single",
                                }).dxList("instance");
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
                                                    const validate = this.hoSoForm.validate();
                                                    if (validate && validate.brokenRules.length === 0) {
                                                        const data: OGHoSoKiemTraModel = self.hoSoForm.option("formData");
                                                        const hoSo: OGHoSoKiemTraModel = self.hoSoListDataSource[0];
                                                        hoSo.loaihoso_id = data.loaihoso_id;
                                                        if (!self.hoSoDataSource) self.hoSoDataSource = [];
                                                        self.hoSoDataSource.push(hoSo);
                                                        self.hoSoGrid.option("dataSource", self.hoSoDataSource);
                                                        self.hoSoPopup.hide();
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
                                                    this.hoSoPopup.hide();
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
                        scrollingEnabled: false,
                    }).dxForm("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: "300px",
            hideOnOutsideClick: false,
            onHiding: () => {
                self.hoSoListDataSource = [];
                self.hoSoFileList.option("dataSource", self.hoSoListDataSource);
                self.hoSoForm.option("formData", {});
            },
            onShowing: () => {
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
            title: "Thêm hồ sơ/ tài liệu liên quan",
            width: "500px",
        }).dxPopup("instance");
    }
    private initLayout(): void {
        this.arguments = {};
        this.maintenanceStore = new CustomStore({
            byKey: (key) => {
                return PhieuKiemTraSuCoService.get(key);
            },
            insert: (values) => {
                return PhieuKiemTraSuCoService.insert(values);
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
                this.arguments["take"] = loadOptions.take ? loadOptions.take : 15;
                if (this.arguments) {
                    PhieuKiemTraSuCoService.list(this.arguments).then(result => {
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
                } else {
                    deferred.resolve({
                        data: [],
                        totalCount: 0
                    });
                }
                return deferred.promise();
            },
            remove: (key) => {
                return PhieuKiemTraSuCoService.delete({ id: key });
            },
            update: (key, values: OGPhieuGiamSatKiemTraSuCoModel) => {
                return PhieuKiemTraSuCoService.insert(values);
            }
        });
        this.phuongThucKiemTraStore = new CustomStore({
            key: "id",
            load: () => {
                const deferred = $.Deferred();
                CategoryService.list(EnumDanhMuc.PHUONGTHUCKIEMTRA).then(result => {
                    if (result.status === EnumStatus.OK) {
                        deferred.resolve(result.data);
                    } else {
                        deferred.resolve([]);
                    }
                });
                return deferred.promise();
            },
            loadMode: "raw"
        });
        this.congCuKiemTraStore = new CustomStore({
            key: "id",
            load: () => {
                const deferred = $.Deferred();
                CategoryService.list(EnumDanhMuc.CONGCUKIEMTRA).then(result => {
                    if (result.status === EnumStatus.OK) {
                        deferred.resolve(result.data);
                    } else {
                        deferred.resolve([]);
                    }
                });
                return deferred.promise();
            },
            loadMode: "raw"
        });
        this.loaiHoSoStore = new CustomStore({
            key: "id",
            load: () => {
                const deferred = $.Deferred();
                CategoryService.list(EnumDanhMuc.LOAIHOSO).then(result => {
                    if (result.status === EnumStatus.OK) {
                        deferred.resolve(result.data);
                    } else {
                        deferred.resolve([]);
                    }
                });
                return deferred.promise();
            },
            loadMode: "raw"
        });
        this.nhanVienStore = new CustomStore({
            key: "id",
            load: () => {
                const deferred = $.Deferred();
                const args = {};
                args["loainhanvien_id"] = this.loaiNhanVienId;

                NhanVienService.list(args).then(result => {
                    if (result && result.status === EnumStatus.OK) {
                        deferred.resolve(result.data);
                    } else {
                        deferred.resolve([]);
                    }
                });
                return deferred.promise();
            },
            loadMode: "raw"
        });
        this.initMaintenance(this.container);
        this.initGiaoViecNhanVien();
        this.initHoSo();
        this.initAnhMinhHoa();
        this.initThongTinTraoDoi();
    }
    private initMaintenance(container): void {
        const self = this;
        //Popup thêm kế hoạch kiểm tra
        this.maintenancePopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                const row = $("<div class='row' />").appendTo(container).height("100%");
                this.maintenanceFormContainer = $("<div class='col-sm-12 col-md-6' />").appendTo(row).height("100%").css({
                    "float": "left",
                });
                this.maintenanceFormContainer.append("<p class=\"maintenance-title\">Thông tin kiểm tra</p>");

                this.columnRightContainer = $("<div class='col-sm-12 col-md-6' />").appendTo(row).css({
                    "border-left": "1px solid #ddd",
                });

                // this.congTrinhBaoDuongGridContainer = $("<div />").appendTo(this.columnRightContainer).height("300px");

                this.hoSoGridContainer = $("<div />").appendTo(this.columnRightContainer).height("300px");

                this.giaoViecNhanVienGridContainer = $("<div />").appendTo(this.columnRightContainer).height("300px");

                this.anhMinhHoaGridContainer = $("<div />").appendTo(this.columnRightContainer).height("300px");

                this.thongTinTraoDoiContainer = $("<div />").css("padding-top", "10px").height("300px").css("border", "1px solid #ddd").appendTo(this.columnRightContainer);

                this.toolbarFormContainer = $("<div />").appendTo(row).css("padding-top", "10px").css("float", "right");

                //Form thông tin chung
                this.maintenanceForm = $("<form />").appendTo(this.maintenanceFormContainer)
                    .dxForm({
                        colCount: 2,
                        height: "100%",
                        items: [{
                            caption: "Thông tin chung",
                            colCount: 2,
                            colSpan: 2,
                            itemType: "group",
                            items: [{
                                dataField: "id",
                                visible: false
                            }, {
                                dataField: "phieugiamsatid",
                                visible: false
                            }, {
                                dataField: "phuongthuckiemtraid",
                                editorOptions: {
                                    dataSource: this.phuongThucKiemTraStore,
                                    displayExpr: "mo_ta",
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
                                    text: "Phương thức kiểm tra",
                                },
                                validationRules: [{
                                    message: "Vui lòng chọn phương thức kiểm tra",
                                    type: "required"
                                }]
                            }, {
                                dataField: "congcukiemtraid",
                                editorOptions: {
                                    dataSource: this.congCuKiemTraStore,
                                    displayExpr: "mo_ta",
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
                                    text: "Công cụ kiểm tra",
                                },
                                validationRules: [{
                                    message: "Vui lòng chọn công cụ kiểm tra",
                                    type: "required"
                                }]
                            }, {
                                dataField: "thoitiet",
                                editorOptions: {
                                    placeholder: "Thời tiết",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Thời tiết",
                                },
                            }, {
                                dataField: "thietbi",
                                editorOptions: {
                                    placeholder: "Thiết bị",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Thiết bị",
                                },
                            }, {
                                dataField: "sonhancong",
                                editorOptions: {
                                    placeholder: "Số nhân công",
                                    showClearButton: true,
                                },
                                editorType: "dxNumberBox",
                                label: {
                                    text: "Số nhân công",
                                },
                            }, {
                                dataField: "vitri",
                                editorOptions: {
                                    placeholder: "Vị trí",
                                    showClearButton: true,
                                },
                                editorType: "dxTextBox",
                                label: {
                                    text: "Vị trí",
                                },
                            }, {
                                colSpan: 2,
                                dataField: "diadiem",
                                editorOptions: {
                                    placeholder: "Địa điểm",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Địa điểm",
                                },
                                validationRules: [{
                                    message: "Vui lòng nhập địa điểm thực hiện công việc",
                                    type: "required"
                                }]
                            }, {
                                dataField: "tencongtrinh",
                                editorOptions: {
                                    placeholder: "Tên công trình",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Tên công trình",
                                },
                            }, {
                                dataField: "goithauso",
                                editorOptions: {
                                    placeholder: "Gói thầu số",
                                    showClearButton: true,
                                },
                                editorType: "dxNumberBox",
                                label: {
                                    text: "Gói thầu số",
                                },
                            }, {
                                dataField: "nhathau",
                                editorOptions: {
                                    placeholder: "Nhà thầu",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Nhà thầu",
                                },
                            }, {
                                dataField: "donvithicong",
                                editorOptions: {
                                    placeholder: "Đơn vị thi công",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Đơn vị thi công",
                                },
                            }, {
                                dataField: "ngaythuchien",
                                editorOptions: {
                                    dateSerializationFormat: "yyyy-MM-ddTHH:mm:ss",
                                    displayFormat: "dd/MM/yyyy",
                                    invalidDateMessage: "Vui lòng nhập đúng định dạng: dd/MM/yyyy",
                                    placeholder: "Ngày thực hiện",
                                    showClearButton: true,
                                    type: "date",
                                },
                                editorType: "dxDateBox",
                                label: {
                                    text: "Ngày thực hiện",
                                },
                                validationRules: [{
                                    message: "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc",
                                    type: "custom",
                                    validationCallback: function (e) {
                                        const startDate = e.value;
                                        const endDate = self.maintenanceForm.getEditor("ngayketthuc").option("value");
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
                                    message: "Vui lòng nhập thời gian thực hiện công việc",
                                    type: "required"
                                }]
                            }, {
                                dataField: "ngayketthuc",
                                editorOptions: {
                                    dateSerializationFormat: "yyyy-MM-ddTHH:mm:ss",
                                    displayFormat: "dd/MM/yyyy",
                                    invalidDateMessage: "Vui lòng nhập đúng định dạng: dd/MM/yyyy",
                                    placeholder: "Ngày kết thúc",
                                    showClearButton: true,
                                    type: "date",
                                },
                                editorType: "dxDateBox",
                                label: {
                                    text: "Ngày kết thúc",
                                },
                                validationRules: [{
                                    message: "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu",
                                    type: "custom",
                                    validationCallback: function (e) {
                                        const startDate = self.maintenanceForm.getEditor("ngaythuchien").option("value");
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
                                colSpan: 2,
                                dataField: "ghichu",
                                editorOptions: {
                                    placeholder: "Ghi chú",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Ghi chú",
                                },
                            }]
                        }, {
                            caption: "Kiểm tra công tác an toàn",
                            colCount: 2,
                            colSpan: 2,
                            itemType: "group",
                            items: [
                                {
                                    dataField: "kiemtracongtacatld",
                                    editorOptions: {
                                        placeholder: "Kiểm tra công tác an toàn lao động",
                                        showClearButton: true,
                                    },
                                    editorType: "dxTextArea",
                                    label: {
                                        text: "Kiểm tra công tác an toàn lao động",
                                    },
                                }, {
                                    dataField: "kiemtracongtacatgt",
                                    editorOptions: {
                                        placeholder: "Kiểm tra công tác an toàn giao thông",
                                        showClearButton: true,
                                    },
                                    editorType: "dxTextArea",
                                    label: {
                                        text: "Kiểm tra công tác an toàn giao thông",
                                    },
                                }, {
                                    dataField: "kiemtractvsmtkhuvuctc",
                                    editorOptions: {
                                        placeholder: "Kiểm tra công tác vệ sinh môi trường khu vực thi công",
                                        showClearButton: true,
                                    },
                                    editorType: "dxTextArea",
                                    label: {
                                        text: "Kiểm tra công tác vệ sinh môi trường khu vực thi công",
                                    },
                                },
                            ],
                        }, {
                            caption: "Kiểm tra duy trì thảm cỏ",
                            colCount: 2,
                            colSpan: 2,
                            itemType: "group",
                            items: [{
                                dataField: "kiemtramatdochephuthamco",
                                editorOptions: {
                                    placeholder: "Kiểm tra mật độ che phủ thảm cỏ",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra mật độ che phủ thảm cỏ",
                                },
                            }, {
                                dataField: "kiemtrachieucaothamco",
                                editorOptions: {
                                    placeholder: "Kiểm tra chiều cao thảm cỏ",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra chiều cao thảm cỏ",
                                },
                            }, {
                                dataField: "kiemtradophangthamco",
                                editorOptions: {
                                    placeholder: "Kiểm tra độ phẳng thảm cỏ",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra độ phẳng thảm cỏ",
                                },
                            }, {
                                dataField: "kiemtradodocmepviathamco",
                                editorOptions: {
                                    placeholder: "Kiểm tra độ dốc về phía mép vỉa",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra độ dốc về phía mép vỉa",
                                },
                            }, {
                                dataField: "kiemtravesinhthamco",
                                editorOptions: {
                                    placeholder: "Kiểm tra vệ sinh thảm cỏ",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra vệ sinh thảm cỏ",
                                },
                            }, {
                                dataField: "kiemtratinhhinhsaubenhcaydaithamco",
                                editorOptions: {
                                    placeholder: "Kiểm tra tình hình sâu bệnh, cây dại",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra tình hình sâu bệnh, cây dại",
                                },
                            },]
                        }, {
                            caption: "Kiểm tra duy trì cây mảng, hoa lưu niên, hàng rào",
                            colCount: 2,
                            colSpan: 2,
                            itemType: "group",
                            items: [{
                                dataField: "kiemtrahinhkhoimanghoaluunien",
                                editorOptions: {
                                    placeholder: "Kiểm tra hình khối",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra hình khối",
                                },
                            }, {
                                dataField: "kiemtramatdochephuhoaluunien",
                                editorOptions: {
                                    placeholder: "Kiểm tra mật độ",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra mật độ",
                                },
                            }, {
                                dataField: "kiemtramausachoaluunien",
                                editorOptions: {
                                    placeholder: "Kiểm tra màu sắc",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra màu sắc",
                                },
                            }, {
                                dataField: "kiemtravesinhgoccayhoaluunien",
                                editorOptions: {
                                    placeholder: "Kiểm tra vệ sinh gốc cây",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra vệ sinh gốc cây",
                                },
                            }, {
                                dataField: "kiemtratinhhinhsaubenhhoaluunien",
                                editorOptions: {
                                    placeholder: "Kiểm tra tình hình sâu bệnh",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra tình hình sâu bệnh",
                                },
                            }, {
                                dataField: "kiemtratinhhinhrahoaluunien",
                                editorOptions: {
                                    placeholder: "Kiểm tra tình hình ra hoa đối với cây hoa lưu niên",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra tình hình ra hoa đối với cây hoa lưu niên",
                                },
                            },]
                        }, {
                            caption: "Kiểm tra duy trì cây cảnh đơn lẻ, khóm",
                            colCount: 2,
                            colSpan: 2,
                            itemType: "group",
                            items: [{
                                dataField: "kiemtradocaocaydonle",
                                editorOptions: {
                                    placeholder: "Kiểm tra độ cao",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra độ cao",
                                },
                            }, {
                                dataField: "kiemtratancaydonle",
                                editorOptions: {
                                    placeholder: "Kiểm tra tán cây",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra tán cây",
                                },
                            }, {
                                dataField: "kiemtramausaclacaydonle",
                                editorOptions: {
                                    placeholder: "Kiểm tra màu sắc lá",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra màu sắc lá",
                                },
                            }, {
                                dataField: "kiemtratinhhinhsaubenhcaydonle",
                                editorOptions: {
                                    placeholder: "Kiểm tra tình hình sâu bệnh",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra tình hình sâu bệnh",
                                },
                            }, {
                                dataField: "kiemtravesinhcaydonle",
                                editorOptions: {
                                    placeholder: "Kiểm tra vệ sinh",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra vệ sinh"
                                }
                            }, {
                                dataField: "kiemtravanggoccaydonle",
                                editorOptions: {
                                    placeholder: "Kiểm tra vầng gốc cây",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra vầng gốc cây",
                                },
                            }, {
                                dataField: "kiemtraanhhuongtamnhincaydonle",
                                editorOptions: {
                                    placeholder: "Kiểm tra việc ảnh hưởng đến tầm nhìn giao thông",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra việc ảnh hưởng đến tầm nhìn giao thông",
                                },
                            },]
                        }, {
                            caption: "Kiểm tra trồng và duy trì hoa thời vụ",
                            colCount: 2,
                            colSpan: 2,
                            itemType: "group",
                            items: [{
                                dataField: "kiemtrahinhkhoibonnamhoa",
                                editorOptions: {
                                    placeholder: "Kiểm tra hình khối bồn, nấm hoa",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra hình khối bồn, nấm hoa",
                                },
                            }, {
                                dataField: "kiemtradotoixopcuadathoathoivu",
                                editorOptions: {
                                    placeholder: "Kiểm tra độ tơi xốp của đất",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra độ tơi xốp của đất",
                                },
                            }, {
                                dataField: "kiemtravesinhhoathoivu",
                                editorOptions: {
                                    placeholder: "Kiểm tra vệ sinh",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra vệ sinh",
                                },
                            }, {
                                dataField: "kiemtratylecaycohoa",
                                editorOptions: {
                                    placeholder: "Kiểm tra tỷ lệ cây có hoa",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra tỷ lệ cây có hoa",
                                },
                            }, {
                                dataField: "kiemtratinhhinhsaubenhhoathoivu",
                                editorOptions: {
                                    placeholder: "Kiểm tra tình hình sâu bệnh",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra tình hình sâu bệnh"
                                }
                            }, {
                                dataField: "kiemtramausachoathoivu",
                                editorOptions: {
                                    placeholder: "Kiểm tra màu sắc của hoa, lá",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra màu sắc của hoa, lá",
                                },
                            }]
                        }, {
                            caption: "Kiểm tra duy trì cây cảnh trồng chậu",
                            colCount: 2,
                            colSpan: 2,
                            itemType: "group",
                            items: [{
                                dataField: "kiemtradocaocaycanh",
                                editorOptions: {
                                    placeholder: "Kiểm tra độ cao",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra độ cao",
                                },
                            }, {
                                dataField: "kiemtratancaycanh",
                                editorOptions: {
                                    placeholder: "Kiểm tra tán cây",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra tán cây",
                                },
                            }, {
                                dataField: "kiemtramausaclacaycanh",
                                editorOptions: {
                                    placeholder: "Kiểm tra màu sắc lá",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra màu sắc lá",
                                },
                            }, {
                                dataField: "kiemtratinhhinhsaubenhcaycanh",
                                editorOptions: {
                                    placeholder: "Kiểm tra tình hình sâu bệnh",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra tình hình sâu bệnh",
                                },
                            }, {
                                dataField: "kiemtrachatluongchaucaycanh",
                                editorOptions: {
                                    placeholder: "Kiểm tra chất lượng chậu cây",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra chất lượng chậu cây"
                                }
                            }, {
                                dataField: "kiemtravesinhchaugoccaycanh",
                                editorOptions: {
                                    placeholder: "Kiểm tra vệ sinh chậu và gốc cây",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra vệ sinh chậu và gốc cây",
                                },
                            }]
                        }, {
                            caption: "Kiểm tra duy trì vệ sinh đường dạo, bãi đất, tượng, mặt hồ, bể cảnh",
                            colCount: 2,
                            colSpan: 2,
                            itemType: "group",
                            items: [{
                                dataField: "kiemtravesinhduongdao",
                                editorOptions: {
                                    placeholder: "Kiểm tra vệ sinh đường đào",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra vệ sinh đường đào",
                                },
                            }, {
                                dataField: "danhgiachatluongthugomrac",
                                editorOptions: {
                                    placeholder: "Đánh giá chất lượng thực hiện, công tác thu gom, tập kết rác",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Đánh giá chất lượng thực hiện, công tác thu gom, tập kết rác",
                                },
                            }]
                        }, {
                            caption: "Kiểm tra duy trì cây bóng mát mới trồng (cây dưới 2 năm và 3 năm)",
                            colCount: 2,
                            colSpan: 2,
                            itemType: "group",
                            items: [{
                                dataField: "kiemtratinhtrangcaybongmat",
                                editorOptions: {
                                    placeholder: "Kiểm tra tình trạng cây",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra tình trạng cây",
                                },
                            }, {
                                dataField: "kiemtravesinhgoccaybongmat",
                                editorOptions: {
                                    placeholder: "Kiểm tra vệ sinh gốc cây",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra vệ sinh gốc cây",
                                },
                            }, {
                                dataField: "kiemtravanggoccaybongmat",
                                editorOptions: {
                                    placeholder: "Kiểm tra vầng gốc cây",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra vầng gốc cây",
                                },
                            }, {
                                dataField: "kiemtravieccatmamnhanhgoccaybongmat",
                                editorOptions: {
                                    placeholder: "Kiểm tra việc cắt mầm nhánh gốc",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra việc cắt mầm nhánh gốc",
                                },
                            }, {
                                dataField: "kiemtraquetvoicaybongmat",
                                editorOptions: {
                                    placeholder: "Kiểm tra quét vôi",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra quét vôi",
                                },
                            }, {
                                dataField: "kiemtrabonphancaybongmat",
                                editorOptions: {
                                    placeholder: "Kiểm tra bón phân",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra bón phân",
                                },
                            }, {
                                dataField: "kiemtracocchongcaybongmat",
                                editorOptions: {
                                    placeholder: "Kiểm tra cọc chống cây",
                                    showClearButton: true,
                                },
                                editorType: "dxTextArea",
                                label: {
                                    text: "Kiểm tra cọc chống cây",
                                },
                            }]
                        }],
                        labelLocation: "top",
                        scrollingEnabled: false,
                    }).dxForm("instance");

                this.maintenanceFormContainer.dxScrollView({
                    height: "100%",
                    showScrollbar: "always"
                });
                this.columnRightContainer.dxScrollView({
                    height: "100%",
                    showScrollbar: "always"
                });
                // Grid hồ sơ
                this.hoSoGrid = $("<div />").appendTo(this.hoSoGridContainer).dxDataGrid({
                    allowColumnResizing: false,
                    columns: [{
                        alignment: "center",
                        caption: "STT",
                        cellTemplate: (container, options) => {
                            const pageIndex = this.hoSoGrid.pageIndex();
                            const pageSize = this.hoSoGrid.pageSize();
                            container.append((pageSize * pageIndex) + options.row["dataIndex"] + 1);
                        },
                        dataField: "index",
                        width: 50,
                    }, {
                        caption: "Loại hồ sơ",
                        dataField: "loaihoso_id",
                        groupIndex: 0,
                        lookup: {
                            dataSource: self.loaiHoSoStore,
                            displayExpr: "mo_ta",
                            valueExpr: "id"
                        }
                    }, {
                        caption: "Tên hồ sơ",
                        cellTemplate: (container, options) => {
                            container.append(`<a href = "${self.config.CDNUrl}${options.data.url}" download="${options.data.file_name}" target= "_blank">${options.data.file_name}</a>`);
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
                                                    self.hoSoDataSource = $.grep(self.hoSoDataSource, function (hoSo) {
                                                        return hoSo.id != options.data.id;
                                                    });
                                                    if (options.data.id > 0) {
                                                        if (!self.deleteHoSoQuanLyIds) self.deleteHoSoQuanLyIds = [];
                                                        self.deleteHoSoQuanLyIds.push(options.data.id);
                                                    }
                                                    self.hoSoGrid.option("dataSource", self.hoSoDataSource);
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
                    dataSource: self.hoSoDataSource,
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
                            location: "before",
                            template: () => {
                                return "<p class=\"maintenance-title\">Tiếp nhận hồ sơ</p>";
                            }
                        }, {
                            location: "after",
                            options: {
                                hint: "Thêm tệp đính kèm",
                                icon: "icon icon-add",
                                onClick: () => {
                                    self.hoSoListDataSource = [];
                                    self.hoSoFileList.option("dataSource", self.hoSoListDataSource);
                                    self.hoSoForm.option("formData", {});
                                    self.hoSoPopup.show();
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
                    showColumnHeaders: true,
                    width: "100%"
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
                                            OGUtils.confirm("Bạn muốn xóa nhân viên này khỏi công việc kiểm tra?").then(value => {
                                                if (value) {
                                                    const index = self.giaoViecNhanVienDatasource.indexOf(options.data);
                                                    if (index > -1) { // only splice array when item is found
                                                        self.giaoViecNhanVienDatasource.splice(index, 1); // 2nd parameter means remove one item only
                                                    }
                                                    this.giaoViecNhanVienGrid.beginUpdate();
                                                    this.giaoViecNhanVienGrid.option("dataSource", self.giaoViecNhanVienDatasource);
                                                    this.giaoViecNhanVienGrid.endUpdate();
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
                            location: "before",
                            template: () => {
                                return "<p class=\"maintenance-title\">Giao việc cho nhân viên</p>";
                            }
                        }, {
                            location: "after",
                            options: {
                                hint: "Thêm nhân viên thực hiện công việc kiểm tra",
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

                // Grid ảnh chụp minh họa
                this.anhMinhHoaGrid = $("<div />").appendTo(this.anhMinhHoaGridContainer).dxDataGrid({
                    allowColumnResizing: false,
                    columns: [{
                        alignment: "center",
                        caption: "STT",
                        cellTemplate: (container, options) => {
                            const pageIndex = this.anhMinhHoaGrid.pageIndex();
                            const pageSize = this.anhMinhHoaGrid.pageSize();
                            container.append((pageSize * pageIndex) + options.row["dataIndex"] + 1);
                        },
                        dataField: "index",
                        visible: false,
                        width: 50,
                    }, {
                        caption: "Tên file",
                        cellTemplate: (container, options) => {
                            container.append(`<a href = "${self.config.CDNUrl}${options.data.url}" download="${options.data.file_name}" target= "_blank">${options.data.file_name}</a>`);
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
                                        hint: "Xóa ảnh chụp",
                                        icon: "icon icon-trash",
                                        onClick: () => {
                                            OGUtils.confirm("Bạn muốn xóa ảnh chụp này?").then(value => {
                                                if (value) {
                                                    self.anhMinhHoaDataSource = $.grep(self.anhMinhHoaDataSource, function (hoSo) {
                                                        return hoSo.id != options.data.id;
                                                    });
                                                    if (options.data.id > 0) {
                                                        if (!self.deleteAnhMinhHoaIds) self.deleteAnhMinhHoaIds = [];
                                                        self.deleteAnhMinhHoaIds.push(options.data.id);
                                                    }
                                                    self.anhMinhHoaGrid.option("dataSource", self.anhMinhHoaDataSource);
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
                    dataSource: self.hoSoDataSource,
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
                            location: "before",
                            template: () => {
                                return "<p class=\"maintenance-title\">Ảnh chụp minh họa</p>";
                            }
                        }, {
                            location: "after",
                            options: {
                                hint: "Thêm ảnh",
                                icon: "icon icon-add",
                                onClick: () => {
                                    this.anhMinhHoaFileInput.trigger("click");
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
                    showColumnHeaders: false,
                    width: "100%"
                }).dxDataGrid("instance");

                // Thông tin trao đổi
                this.thongTinTraoDoiList = $("<div />").height("250px").appendTo(this.thongTinTraoDoiContainer).dxList({
                    dataSource: self.thongTinTraoDoiDatasource,
                    height: "250",
                    itemTemplate: (data) => {
                        if (data.image_url) {
                            data.full_image_url = `${self.config.CDNUrl}${self.config.ImagePath}/${data.image_url}`;
                        }
                        return Handlebars.compile(ChatItem)(data);
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

                this.thongTinTraoDoiContainer.append(Handlebars.compile(SendMessageTmp)({}));

                this.columnRightContainer.dxScrollView({
                    height: "calc(100% - 50px)",
                    showScrollbar: "always"
                });

                // this.maintenanceFormToolbar = $("<div>").appendTo(this.toolbarFormContainer).dxToolbar({
                //     items: [{
                //         location: "center",
                //         options: {
                //             onClick: () => {
                //                 self.save();
                //             },
                //             stylingMode: "contained",
                //             text: "Lưu",
                //             type: "default"
                //         },
                //         widget: "dxButton"
                //     }, {
                //         location: "center",
                //         options: {
                //             onClick: () => {
                //                 this.maintenancePopup.hide();
                //             },
                //             stylingMode: "contained",
                //             text: "Hủy",
                //             type: "danger"
                //         },
                //         widget: "dxButton"
                //     }]
                // }).dxToolbar("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: "90%",
            hideOnOutsideClick: false,
            onContentReady: () => {
            },
            onHiding: () => {
                self.refreshCreateMaintenance();
            },
            onShowing: () => {
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
            title: "Tạo mới phiểu giám sát công việc kiểm tra duy trì thảm cỏ, cây xanh",
            toolbarItems: [{
                location: "center",
                options: {
                    onClick: () => {
                        self.save();
                    },
                    stylingMode: "contained",
                    text: "Lưu",
                    type: "default"
                },
                toolbar: "bottom",
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
                toolbar: "bottom",
                widget: "dxButton"
            }],
            width: "90%",
        }).dxPopup("instance");

        this.maintenanceGrid = $("<div />").appendTo(container).dxDataGrid({
            allowColumnReordering: true,
            allowColumnResizing: true,
            columnChooser: {
                enabled: false,
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
                visible: false,
                width: 50
            }, {
                caption: "Phương thức kiểm tra",
                dataField: "phuongthuckiemtraid",
                lookup: {
                    dataSource: this.phuongThucKiemTraStore,
                    displayExpr: "mo_ta",
                    valueExpr: "id"
                },
                visible: true
            }, {
                caption: "Công cụ kiểm tra",
                dataField: "congcukiemtraid",
                lookup: {
                    dataSource: this.congCuKiemTraStore,
                    displayExpr: "mo_ta",
                    valueExpr: "id"
                },
                visible: true
            }, {
                caption: "Tên công trình",
                dataField: "tencongtrinh",
                visible: false
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
                        items: [{
                            hint: "In phiểu công việc kiểm tra",
                            icon: "icon icon-printer",
                            onClick: () => {
                                PhieuKiemTraSuCoService.get(options.data.id).then(result => {
                                    if (result) {
                                        self.bindMaintenanceItemIframe(result);
                                        if (self.maintenanceItemIframe) {
                                            self.maintenanceItemIframe.get(0)["contentWindow"].print();
                                        }
                                    }
                                });
                            },
                            text: "In phiểu công việc kiểm tra",
                        }, {
                            hint: "Cập nhật phiếu giám sát kiểm tra cây xanh",
                            icon: "icon icon-edit-2",
                            onClick: () => {
                                PhieuKiemTraSuCoService.get(options.data.id).then(result => {
                                    if (result) {
                                        self.bindMaintenance(result);
                                        self.maintenancePopup.option("title", "Cập nhật phiếu giám sát kiểm tra cây xanh");
                                        self.maintenancePopup.show();
                                    }
                                });
                            },
                            text: "Cập nhật phiếu giám sát"
                        }, {
                            hint: "Xóa phiếu giám sát kiểm tra cây xanh",
                            icon: "icon icon-trash",
                            onClick: () => {
                                OGUtils.confirm("Bạn muốn xóa phiếu giám sát kiểm tra này?").then(value => {
                                    if (value) {
                                        options.component.getDataSource().store().remove(options.data.id).then(() => {
                                            options.component.getDataSource().reload();
                                        });
                                    }
                                });
                            },
                            text: "Xóa phiếu giám sát"
                        }],
                        stylingMode: "contained",
                    });
                },
                dataField: "id",
                width: 70,
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
                        hint: "Xuất báo cáo công việc giám sát kiểm tra cây xanh",
                        icon: "icon icon-ram",
                        onClick: () => {
                            OGUtils.postDownload("/api/cay-xanh/kiem-tra/export", self.arguments);
                        },
                        type: "success"
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        hint: "Tạo mới phiểu giám sát công việc kiểm tra",
                        icon: "icon icon-add",
                        onClick: () => {
                            self.refreshCreateMaintenance();
                            self.maintenancePopup.option("title", "Tạo mới phiểu giám sát công việc kiểm tra duy trì thảm cỏ, cây xanh");
                            self.maintenancePopup.show();
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
                            self.maintenanceGrid.getDataSource().reload();
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

        this.maintenanceItemIframe = $("<iframe />")
            .prop("frameborder", "0")
            .css("width", "100%")
            .css("height", "100%")
            .css("overflow", "hidden")
            .appendTo("body");
    }
    private initThongTinTraoDoi(): void {
        const self = this;
        this.chatFiles = [];
        this.newChats = [];
        //Lưu chat
        $(document).on("click", "#btnSendChat", function (e) {
            e.preventDefault();
            $("#formChat").trigger("submit");
        });

        $(document).on("keydown", "#chat-message", (e) => {
            if (e.key === "Enter" || e.keyCode === 13) {
                $("#formChat").trigger("submit");
            }
        });
        $(document).on("submit", "#formChat", function (e) {
            e.preventDefault();
            self.saveChat();
        });

        self.fileChatInput = $("<input type=\"file\" accept=\"image/*\" style=\"display:none !important\" />")
            .appendTo($("#formChat"))
            .on("change", (e) => {
                for (let i = 0; i < e.target["files"].length; i++) {
                    const file = e.target["files"][i];
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        const url = e.target.result;
                        $(".input-image").append(`<input type="image" id="chat-image" src ="${url}" height="150">`);
                        self.chatFiles.push({
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
            self.fileChatInput.trigger("click");
        });
    }

    private refreshCreateMaintenance(): void {
        this.maintenanceForm.option("formData", {});
        this.hoSoDataSource = [];
        this.hoSoGrid.option("dataSource", []);
        this.giaoViecNhanVienDatasource = [];
        this.giaoViecNhanVienGrid.option("dataSource", []);
        this.anhMinhHoaDataSource = [];
        this.anhMinhHoaGrid.option("dataSource", []);
        this.thongTinTraoDoiDatasource = [];
        this.thongTinTraoDoiList.option("dataSource", []);
    }

    private save(): void {
        const self = this;
        const validate = self.maintenanceForm.validate();
        if (validate && validate.brokenRules.length === 0) {

            const data: OGPhieuGiamSatKiemTraSuCoModel = self.maintenanceForm.option("formData");
            data.giaoViecNhanViens = self.giaoViecNhanVienDatasource;
            data.deleteHoSoQuanLyIds = self.deleteHoSoQuanLyIds;
            data.deleteAnhMinhHoaIds = self.deleteAnhMinhHoaIds;
            if (self.newChats && self.newChats.length) {
                data.thongTinTraoDois = self.newChats.filter(maintenanceChat => { return (!maintenanceChat.file && (!maintenanceChat.id || maintenanceChat.id === 0)); });
            }
            delete data.hoSoQuanLys;
            OGUtils.showLoading();

            PhieuKiemTraSuCoService.insert(data).then(result => {
                if (result) {
                    const defArray = [];
                    $.each(self.hoSoDataSource, (idx, hoSo) => {
                        if (!hoSo.id) {
                            hoSo.phieugiamsat_id = result.id;
                            hoSo.loaikiemtra = this.loaiKiemTra;
                            defArray.push(KiemTraService.uploadHoSo(hoSo));
                        }
                    });
                    result.anhMinhHoas = self.anhMinhHoaDataSource;
                    defArray.push(KiemTraService.uploadAnhMinhHoa(result, this.loaiKiemTra));

                    if (self.newChats && self.newChats.length) {
                        defArray.push(new Promise((resolve) => {
                            const chatFiles = self.newChats.filter(maintenanceChat => { return maintenanceChat.file; });
                            if (chatFiles && chatFiles.length > 0) {
                                defArray.push(KiemTraService.uploadTraoDoi(result, this.loaiKiemTra));
                            } else {
                                resolve({});
                            }
                        }));
                    }
                    Promise.all(defArray).then(() => {
                        OGUtils.hideLoading();
                        if (data.giaoViecNhanViens.length) {
                            OGUtils.showLoading("Đang gửi thông báo qua mail và đi dộng!");
                            PhieuKiemTraSuCoService.notify(data).then(result => {
                                OGUtils.alert("Lưu kế hoạch kiểm tra thành công", "Thành công");
                                this.maintenanceGrid.getDataSource().reload();
                                this.maintenancePopup.hide();
                                self.newChats = [];
                            });
                        }
                        else {
                            OGUtils.hideLoading();
                            OGUtils.alert("Lưu kế hoạch kiểm tra thành công", "Thành công");
                            this.maintenanceGrid.getDataSource().reload();
                            this.maintenancePopup.hide();
                            self.newChats = [];
                        }

                    });
                } else {
                    OGUtils.hideLoading();
                    self.maintenancePopup.hide();
                }
            });
        }
    }

    private saveChat(): void {
        const self = this;
        if (!self.thongTinTraoDoiDatasource) {
            self.thongTinTraoDoiDatasource = [];
        }
        if (self.chatFiles && self.chatFiles.length) {
            $.each(self.chatFiles, function (idx, file) {
                const dataImage: OGThongTinTraoDoiModel = {
                    file: file.raw,
                    full_image_url: file.url,
                    uid: OGUtils.uuidv4(),
                    user_cr_dtime: moment(new Date(), "DD/MM/YYYY").format(),
                };
                self.thongTinTraoDoiDatasource.push(dataImage);
                self.newChats.push(dataImage);
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
            self.thongTinTraoDoiDatasource.push(data);
            self.newChats.push(data);
        }
        self.thongTinTraoDoiList.option("dataSource", self.thongTinTraoDoiDatasource);
        self.chatFiles = [];
        $(".input-image").empty();
        $("#formChat").trigger("reset");
    }

    onInit(): void {

    }
}

export { MaintenanceView };
