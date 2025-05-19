import axios from "axios";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import "devextreme/ui/button";
import dxDateRangeBox from "devextreme/ui/date_range_box";
import "devextreme/ui/date_range_box";
import dxForm from "devextreme/ui/form";
import { dxFormSimpleItem as FormItem } from "devextreme/ui/form";
import dxMultiView from "devextreme/ui/multi_view";
import "devextreme/ui/multi_view";
import "devextreme/ui/pager";
import dxSelectBox from "devextreme/ui/select_box";
import "devextreme/ui/select_box";
import dxTagBox from "devextreme/ui/tag_box";
import "devextreme/ui/tag_box";
import dxToolbar from "devextreme/ui/toolbar";
import "devextreme/ui/toolbar";
import dxTreeView, { dxTreeViewItem } from "devextreme/ui/tree_view";
import "devextreme/ui/tree_view";
import dxChart from "devextreme/viz/chart";
import "devextreme/viz/chart";
import dxPieChart from "devextreme/viz/pie_chart";
import "devextreme/viz/pie_chart";
import Handlebars from "handlebars";
import moment from "moment";
import { optionsFromCapabilities } from "ol/source/WMTS";

import ThematicReportComponent from "../../../../../libs/core/components/thematic-report/thematic-report.component";
import { RazorView } from "../../../../../libs/core/decorators/razor-view.decorator";
import { EnumChartType, EnumDataType, EnumMap, EnumReportType, EnumStatus, EnumThongKePhanLoai } from "../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../libs/core/helpers/utils";
import { Layout } from "../../../../../libs/core/layout";
import { OGLayerModel } from "../../../../../libs/core/models/layer.model";
import { AreaService } from "../../../../../libs/core/services/area.service";
import { ReportService } from "../../../../../libs/core/services/report.service";
import { TableColumnService } from "../../../../../libs/core/services/table.service";
import "./index.view.scss";
import BaoCaoChieuDaiTemp from "./templates/baocao_chieudai.hbs";
import BaoCaoSoLuongTheoLoaiCongTrinhLoaiNhaTemp from "./templates/baocao_soluong_loainha_congtrinh.hbs";
import BaoCaoThongKeLoaiCongTrinhTemp from "./templates/baocao_thongke_loai_congtrinh.hbs";
import BaoCaoThongKeLoaiCongTrinhChieuSangTemp from "./templates/baocao_thongke_loai_congtrinh_chieusang.hbs";
import BaoCaoSoLuongTemp from "./templates/baocao_thongke_soluong.hbs";
import BaoCaoThongTinChungHoSoTemp from "./templates/baocao_thongtin_chung_so.hbs";
import BaoCaoTuyChonBaoTriTemp from "./templates/baocao_tuychon_baotri.hbs";
import BaoCaoTuyChonHoSoTemp from "./templates/baocao_tuychon_hoso.hbs";
import BaoCaoTuyChonSuCoTemp from "./templates/baocao_tuychon_suco.hbs";

@RazorView()
class StatisticReportView extends Layout {
    chart: dxChart | dxPieChart;
    chartContainer: JQuery<HTMLElement>;
    colorCharts: unknown;
    container: JQuery<HTMLElement>;
    currentReport: string;
    filterForm: dxForm;
    filterFormScrollView: JQuery<HTMLElement>;
    formDataFilter: object;
    mainAccordionContainer: JQuery<HTMLElement>;
    mapId: number;
    pageIndex: number;
    pageSize: number;
    reportContainer: JQuery<HTMLElement>;
    reportOptionsTreeView: dxTreeView;
    reportTableIframe: JQuery<HTMLElement>;
    reportTableToolbar: dxToolbar;
    reportToolbar: dxToolbar;
    reportToolbarBieuMau: dxToolbar;
    reportView: dxMultiView;
    schemaCayXanh: string;
    selectedReportType: dxTreeViewItem;
    thematicReport: ThematicReportComponent;
    thematicReportTree: dxTreeView;
    constructor() {
        super("child", "Báo cáo thống kê");
        this.pageIndex = 1;
        this.pageSize = 25;
        this.container = $("#report-container");
        this.schemaCayXanh = "csdl_cayxanh";
    }

    private exportReportToExcel(): void {
        const dateEditor = this.filterForm.getEditor("date");
        let dateStart, dateEnd;
        if (dateEditor) {
            dateStart = dateEditor.option("startDate") ? moment(dateEditor.option("startDate")).format("YYYY-MM-DD") : null;
            dateEnd = dateEditor.option("endDate") ? moment(dateEditor.option("endDate")).format("YYYY-MM-DD") : null;
        }

        let groupName = "";
        const groupBySelectBox = this.filterForm.getEditor("group_by") as dxSelectBox;
        if (groupBySelectBox) {
            groupName = groupBySelectBox.option("displayValue");
        }
        let layer_ids: number[] = [];
        const layerSelectBox = this.filterForm.getEditor("layer_id") as dxSelectBox;
        if (layerSelectBox) {
            layer_ids = this.filterForm.option("formData").layer_id;
        }
        let textSearch = "";
        const textSearchEditor = this.filterForm.getEditor("textSearch");
        if (textSearchEditor) {
            if (textSearchEditor instanceof dxTagBox) {
                textSearch = this.filterForm.option("formData").textSearch?.toString();
            } else if (textSearchEditor instanceof dxSelectBox) {
                textSearch = this.filterForm.option("formData").textSearch;
            }
        }
        const param = {
            communeCode: this.filterForm.option("formData").communeCode,
            dateEnd: dateEnd,
            dateStart: dateStart,
            districtCode: this.filterForm.option("formData").districtCode,
            groupBy: this.filterForm.option("formData").group_by,
            groupName: groupName,
            layerIds: layer_ids,
            reportType: this.selectedReportType.id,
            textSearch: textSearch,
            title: this.selectedReportType.text,
        };
        OGUtils.postDownload("/api/report/export-custom-report", param);
    }

    private getChartReport(options: object): void {
        if (this.chart) {
            this.chart.dispose();
            this.chartContainer.empty();
        }

        this.reportView.option("selectedIndex", 1);

        if (options["chart_type"] === "bar-chart" || options["chart_type"] === "line-chart") {
            this.chart = $("<div />").css("padding", "10px").css("height", "100%").appendTo(this.chartContainer).dxChart({
                // argumentAxis: { // or valueAxis, or commonAxisSettings
                //     label: {
                //         displayMode: "rotate",
                //         rotationAngle: "-45",
                //     },
                //     position: "center",
                // },
                commonSeriesSettings: {
                    argumentField: "detail",
                    ignoreEmptyPoints: true,
                    type: "bar",
                    valueField: "count",
                },
                dataSource: options["data"],
                export: {
                    enabled: true,
                    printingEnabled: true
                },
                legend: {
                    horizontalAlignment: "center",
                    paddingTopBottom: 50,
                    verticalAlignment: "bottom",
                    visible: true,
                },
                onLegendClick: (e) => {
                    if (e.target.isVisible()) {
                        e.target.hide();
                    } else {
                        e.target.show();
                    }
                },
                // palette: "soft",
                scrollBar: {
                    visible: true,
                },
                seriesTemplate: {
                    nameField: "description",
                },
                // size: {
                //     height: "100%",
                //     widht: "100%",
                // },
                title: {
                    font: {
                        family: "Open Sans, Helvetica Neue, Segoe UI, Helvetica, Verdana, sans-serif",
                        size: 20,
                        weight: 400
                    },
                    text: "Biểu đồ " + options["title"]
                },
                tooltip: {
                    contentTemplate: (info, container) => {
                        const raw = info.point.data;
                        //container.css({
                        //    'width': '40vw'
                        //});
                        return $("<b style=\" word-break: break-all; white-space: normal;\"/>").text(`${raw.description}: ${parseFloat(info.valueText).toLocaleString("vi-VN")} (${raw.donvitinh})`).appendTo(container);
                    },
                    enabled: true,
                    paddingLeftRight: 10,
                    paddingTopBottom: 5,
                },
                zoomAndPan: {
                    argumentAxis: "both",
                },
            }).dxChart("instance");
        } else if (options["chart_type"] === "pie-chart") {
            this.chart = $("<div  />").css("padding", "10px").css("height", "100%").appendTo(this.chartContainer).dxPieChart({
                // customizePoint: (e) => {
                //     if (options["colors"]) {
                //         return {
                //             color: options["colors"][e.argument]
                //         };
                //     }
                //     return {
                //         color: OGUtils.rainbow(options["data"].length, 5)
                //     };
                // },
                dataSource: {
                    store: options["data"]
                },
                series: [{
                    argumentField: "description",
                    label: {
                        connector: {
                            visible: true,
                            width: 1
                        },
                        customizeText(arg) {
                            return `${arg.valueText} (${arg.percentText})`;
                        },
                        visible: true,
                    },
                    name: "detail",
                    valueField: "count"
                }],
                // size: {
                //     height: "100%",
                //     widht: "100%",
                // },
                title: {
                    font: {
                        family: "'Reddit Sans', Open Sans, Helvetica Neue, Segoe UI, Helvetica, Verdana, sans-serif",
                        size: 20,
                        weight: 400
                    },
                    text: "Biểu đồ " + options["title"]
                },
                tooltip: {
                    contentTemplate: (info, container) => {
                        const raw = info.point.data;
                        return $("<b style=\" word-break: break-all; white-space: normal;\"/>").text(`${raw.description}: ${parseFloat(info.valueText).toLocaleString("vi-VN")} (${raw.donvitinh})`).appendTo(container);
                    },
                    enabled: true,
                    paddingLeftRight: 10,
                    paddingTopBottom: 5,
                }
            }).dxPieChart("instance");
        }
    }
    private getCustomChartData(): PromiseLike<ArrayLike<unknown>> {
        const def = $.Deferred();
        const groupBy = this.filterForm.option("formData").group_by;
        axios({
            data: {
                communeCode: this.filterForm.option("formData").communeCode,
                districtCode: this.filterForm.option("formData").districtCode,
                groupBy: groupBy,
                reportType: this.selectedReportType.id
            },
            method: "POST",
            url: "/api/report/custom-chart-data",
        }).then((xhr) => {
            if (xhr.data.status === EnumStatus.OK) {
                const data = xhr.data.data.result;
                def.resolve(data);
            }
            else {
                def.resolve([]);
                OGUtils.error(xhr.data["errors"][0].message);
            }
        });
        return def.promise();
    }
    private getData(options: object): PromiseLike<unknown> {
        const def = $.Deferred();
        const groupBySelectBox = this.filterForm.getEditor("group_by") as dxSelectBox;
        const layerTagBox = this.filterForm.getEditor("layer_id") as dxTagBox;
        axios({
            data: options,
            method: "POST",
            url: "/api/report/custom-report-data",
        }).then((xhr) => {
            if (xhr.data.status === "OK") {
                const data = xhr.data.data;
                let counter = this.pageSize * (this.pageIndex - 1);
                const showToolbar = true;
                let content;
                switch (options["reportType"]) {
                    case EnumReportType.SoLuong.id:
                        data.title = EnumReportType.SoLuong.title;
                        data.data.forEach(hoSoGroupByLoaiNha => {
                            hoSoGroupByLoaiNha.items.forEach(hoSoFroupByLoaiCongTrinh => {
                                hoSoFroupByLoaiCongTrinh.hoSos.forEach(hoSo => {
                                    hoSo.stt = ++counter;
                                });
                            });
                        });
                        content = Handlebars.compile(BaoCaoSoLuongTheoLoaiCongTrinhLoaiNhaTemp)(data);
                        break;
                    case EnumReportType.SoLuongSuCo.id:
                        data.title = EnumReportType.SoLuongSuCo.title;
                        data.data.forEach(item => {
                            item.stt = ++counter;
                        });
                        content = Handlebars.compile(BaoCaoTuyChonSuCoTemp)(data);
                        break;
                    case EnumReportType.SoLuongBaoTriBaoDuong.id:
                        data.title = EnumReportType.SoLuongBaoTriBaoDuong.title;
                        data.data.forEach(item => {
                            item.stt = ++counter;
                        });
                        content = Handlebars.compile(BaoCaoTuyChonBaoTriTemp)(data);
                        break;
                    case EnumReportType.TinhTrangHoSo.id:
                        data.title = EnumReportType.TinhTrangHoSo.title;
                        data.data.forEach(item => {
                            item.stt = ++counter;
                        });
                        content = Handlebars.compile(BaoCaoThongTinChungHoSoTemp)(data);
                        break;
                    case EnumReportType.SoLuongHoSo.id:
                        data.title = EnumReportType.SoLuongHoSo.title;
                        if (groupBySelectBox) {
                            const groupBy = groupBySelectBox.option("displayValue");
                            if (groupBy) {
                                data.title = data.title + " theo " + groupBy.toLowerCase();
                            }
                        }
                        data.data.forEach(item => {
                            item.hoSos.forEach(hoSo => {
                                hoSo.stt = ++counter;
                            });
                        });
                        content = Handlebars.compile(BaoCaoTuyChonHoSoTemp)(data);
                        break;
                    case EnumReportType.DuyetHoSoMoiNhat.id:
                        data.data.forEach(item => {
                            item.stt = ++counter;
                        });
                        data.title = EnumReportType.DuyetHoSoMoiNhat.title;
                        content = Handlebars.compile(BaoCaoThongTinChungHoSoTemp)(data);
                        break;
                    case EnumReportType.ChieuDaiTuyenCap.id:
                        data.title = EnumReportType.ChieuDaiTuyenCap.title;
                        data.data.forEach(item => {
                            item.items.forEach(child => {
                                child.stt = ++counter;
                            });
                        });
                        if (groupBySelectBox) {
                            const groupBy = groupBySelectBox.option("displayValue");
                            if (groupBy) {
                                data.title = data.title + " theo " + groupBy.toLowerCase();
                                if (groupBySelectBox.option("value") === "HANHCHINH") {
                                    data.group_name = "Phường/Xã";
                                } else {
                                    data.group_name = "Tuyến cáp";
                                }
                            }
                            content = Handlebars.compile(BaoCaoChieuDaiTemp)(data);
                        }
                        break;
                    case EnumReportType.ThongKeSoLuong.id:
                        if (groupBySelectBox) {
                            const groupBy = groupBySelectBox.option("displayValue");
                            const layerSelected = layerTagBox.option("selectedItems");
                            if (layerSelected.length == 1) {
                                const layerName = layerSelected[0].name_vn;
                                data.title = "Thống kê số lượng " + layerName.toLowerCase() + " theo " + groupBy.toLowerCase();
                                data.unit = "(" + layerName.toLowerCase() + ")";
                                data.group_name = groupBy;
                            } else {
                                data.title = "Thống kê số lượng tài sản theo tuyến";
                                data.group_name = "Công trình";
                            }
                            data.data.forEach(item => {
                                item.items.forEach(x => {
                                    x.stt = ++counter;
                                    if (!x.key) {
                                        item.description = "Không xác định";
                                    }
                                });
                            });
                            content = Handlebars.compile(BaoCaoSoLuongTemp)(data);
                        }
                        break;
                    case EnumReportType.ThongKeCayXanhTheoTuyen.id:
                        data.title = "Thống kê số lượng công trình cây xanh theo tuyến";
                        data.group_name = "Phân loại";
                        data.data.forEach(tuyen => {
                            tuyen.items.forEach(item => {
                                item.stt = ++counter;
                                item.count_row = item.items.length + 1;
                            });
                        });
                        content = Handlebars.compile(BaoCaoThongKeLoaiCongTrinhTemp)(data);
                        break;
                    case EnumReportType.ThongKeChieuSangTheoTuyen.id:
                        data.title = "Thống kê số lượng công trình chiếu sáng theo tuyến";
                        data.group_name = "Phân loại";
                        data.data.forEach(tuyen => {
                            tuyen.items.forEach(tram => {
                                tram.items.forEach(item => {
                                    item.stt = ++counter;
                                    item.count_row = item.items.length + 1;
                                });
                            });
                        });
                        content = Handlebars.compile(BaoCaoThongKeLoaiCongTrinhChieuSangTemp)(data);
                        break;
                    case EnumReportType.ThongKeChieuSangTheoTramDen.id:
                        data.title = EnumReportType.ThongKeChieuSangTheoTramDen.title;
                        data.group_name = "Phân loại";
                        data.data.forEach(tuyen => {
                            tuyen.items.forEach(tram => {
                                tram.items.forEach(item => {
                                    item.stt = ++counter;
                                    item.count_row = item.items.length + 1;
                                });
                            });
                        });
                        content = Handlebars.compile(BaoCaoThongKeLoaiCongTrinhChieuSangTemp)(data);
                        break;
                    case EnumReportType.ThongKeThoatNuocTheoTuyen.id:
                        data.title = "Thống kê số lượng công trình thoát nước theo tuyến";
                        data.group_name = "Phân loại";
                        data.data.forEach(tuyen => {
                            tuyen.items.forEach(item => {
                                item.stt = ++counter;
                                item.count_row = item.items.length + 1;
                            });
                        });
                        content = Handlebars.compile(BaoCaoThongKeLoaiCongTrinhTemp)(data);
                        break;
                    case EnumReportType.ThongKeThoatNuocTheoHo.id:
                        data.title = "Thống kê số lượng công trình thoát nước theo hồ";
                        data.group_name = "Phân loại";
                        data.data.forEach(tuyen => {
                            tuyen.items.forEach(item => {
                                item.stt = ++counter;
                                item.count_row = item.items.length + 1;
                            });
                        });
                        content = Handlebars.compile(BaoCaoThongKeLoaiCongTrinhTemp)(data);
                        break;
                    case EnumReportType.ThongKePhanLoaiCongThoatNuoc.id:
                        data.title = "Thống kê phân loại cống thoát nước";
                        data.group_name = "Tiết diện";
                        data.data.forEach(tuyen => {
                            tuyen.items.forEach(item => {
                                item.stt = ++counter;
                                item.count_row = item.items.length + 1;
                            });
                        });
                        content = Handlebars.compile(BaoCaoThongKeLoaiCongTrinhTemp)(data);
                        break;
                    case EnumReportType.SoLuongCayXanh.id:
                        data.title = EnumReportType.SoLuongCayXanh.title;
                        data.data.forEach(item => {
                            item.items.forEach(child => {
                                child.stt = ++counter;
                            });
                        });
                        if (groupBySelectBox) {
                            const groupBy = groupBySelectBox.option("displayValue");
                            if (groupBy) {
                                data.title = data.title + " theo " + groupBy.toLowerCase();
                                data.unit = "cây";
                                if (groupBySelectBox.option("value") === "HANHCHINH") {
                                    data.group_name = "Phường/Xã";
                                } else if (groupBySelectBox.option("value") === "MATUYEN") {
                                    data.group_name = "Tuyến đường";
                                } else {
                                    data.group_name = "Loại cây";
                                }
                            }
                            content = Handlebars.compile(BaoCaoSoLuongTemp)(data);
                        }
                        break;
                    case EnumReportType.SoLuongCongThoatNuoc.id:
                        data.title = EnumReportType.SoLuongCongThoatNuoc.title;
                        data.data.forEach(item => {
                            item.items.forEach(child => {
                                child.stt = ++counter;
                            });
                        });
                        if (groupBySelectBox) {
                            const groupBy = groupBySelectBox.option("displayValue");
                            if (groupBy) {
                                data.title = data.title + " theo " + groupBy.toLowerCase();
                                data.unit = "cống";
                                if (groupBySelectBox.option("value") === "HANHCHINH") {
                                    data.group_name = "Phường/Xã";
                                } else if (groupBySelectBox.option("value") === "MATUYEN") {
                                    data.group_name = "Tuyến";
                                } else {
                                    data.group_name = "Loại cống thoát nước";
                                }
                            }
                            content = Handlebars.compile(BaoCaoSoLuongTemp)(data);
                        }
                        break;
                    case EnumReportType.SoLuongHoGa.id:
                        data.title = EnumReportType.SoLuongHoGa.title;
                        data.data.forEach(item => {
                            item.items.forEach(child => {
                                child.stt = ++counter;
                            });
                        });
                        if (groupBySelectBox) {
                            const groupBy = groupBySelectBox.option("displayValue");
                            if (groupBy) {
                                data.title = data.title + " theo " + groupBy.toLowerCase();
                                data.unit = "hố ga";
                                if (groupBySelectBox.option("value") === "HANHCHINH") {
                                    data.group_name = "Phường/Xã";
                                } else if (groupBySelectBox.option("value") === "MATUYEN") {
                                    data.group_name = "Tuyến";
                                } else {
                                    data.group_name = "Loại hố";
                                }
                            }
                            content = Handlebars.compile(BaoCaoSoLuongTemp)(data);
                        }
                        break;
                    case EnumReportType.ChieuDaiCongThoatNuoc.id:
                        data.title = EnumReportType.ChieuDaiCongThoatNuoc.title;
                        data.data.forEach(item => {
                            item.items.forEach(child => {
                                child.stt = ++counter;
                            });
                        });
                        if (groupBySelectBox) {
                            const groupBy = groupBySelectBox.option("displayValue");
                            if (groupBy) {
                                data.title = data.title + " theo " + groupBy.toLowerCase();
                                if (groupBySelectBox.option("value") === "HANHCHINH") {
                                    data.group_name = "Phường/Xã";
                                } else {
                                    data.group_name = "Tuyến cáp";
                                }
                            }
                            content = Handlebars.compile(BaoCaoChieuDaiTemp)(data);
                        }
                        break;
                    default:
                        break;
                }
                def.resolve({
                    content: content,
                    data: data,
                    showToolbar: showToolbar,
                    totalCount: data.totalCount
                });
            }
            else {
                OGUtils.alert(xhr.data["errors"][0].message, "Lỗi");
            }
            OGUtils.hideLoading();
        });
        return def.promise();
    }
    private getFilterFormItems(type: string, report_id): FormItem[] {
        const self = this;
        const items = [];
        const groupItems = [];
        this.formDataFilter = {};
        switch (type) {
            case "table":
                items.push({
                    template: () => {
                        return "<hr style=\"margin: 5px 0;\" />";
                    }
                });
                switch (report_id) {
                    case EnumReportType.SoLuongHoSo.id:
                        items.push({
                            dataField: "group_by",
                            editorOptions: {
                                dataSource: [{
                                    "id": "TINHTRANG",
                                    "text": "Tình trạng",
                                }, {
                                    "id": "LOAINHA",
                                    "text": "Loại nhà",
                                }],
                                displayExpr: "text",
                                valueExpr: "id",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Nhóm theo"
                            },
                        });
                        break;
                    case EnumReportType.DuyetHoSoMoiNhat.id:
                        items.push({
                            dataField: "date",
                            editorOptions: {
                                applyValueMode: "useButtons",
                                endDate: new Date(),
                                endDateLabel: "Ngày kết thúc",
                                endDateOutOfRangeMessage: "Ngày kết thúc nằm ngoài phạm vi",
                                invalidEndDateMessage: "Ngày kết thúc không hợp lệ",
                                invalidStartDateMessage: "Ngày bắt đâu không hợp lệ",
                                startDate: new Date(),
                                startDateLabel: "Ngày bắt đầu",
                                startDateOutOfRangeMessage: "Ngày bắt đầu nằm ngoài phạm vi"
                            },
                            editorType: "dxDateRangeBox",
                            label: {
                                text: "Ngày"
                            },
                        });
                        break;
                    case EnumReportType.ChieuDaiTuyenCap.id:
                    case EnumReportType.ChieuDaiCongThoatNuoc.id:
                        items.push({
                            dataField: "group_by",
                            editorOptions: {
                                dataSource: [{
                                    "id": "HANHCHINH",
                                    "text": "Hành chính",
                                }, {
                                    "id": "MATUYEN",
                                    "text": "Tuyến",
                                }],
                                displayExpr: "text",
                                valueExpr: "id",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Nhóm theo"
                            },
                            validationRules: [{
                                message: "Vui lòng chọn tiêu chí nhóm",
                                type: "required"
                            }]
                        });
                        items.push({
                            dataField: "textSearch",
                            editorOptions: {
                                dataSource: {
                                    pageSize: 25,
                                    paginate: true,
                                    store: new CustomStore({
                                        load: (options) => {
                                            return new Promise((resolve) => {
                                                // Dropdown tentuyen - tuyenid
                                                ReportService.listDistinctValues("tn_tuyen", options.searchValue, (options.skip / options.take) + 1, options.take).then(data => {
                                                    resolve({
                                                        data: data.data,
                                                        totalCount: data.recordsTotal
                                                    });
                                                });
                                            });
                                        },
                                    })
                                },
                                deferRendering: true,
                                maxDisplayedTags: 1,
                                multiline: false,
                                noDataText: "Không có dữ liệu",
                                onContentReady: () => {
                                    $(".dx-list-item-content").each(function () {
                                        const $ele = $(this);
                                        if (this.offsetWidth < this.scrollWidth) {
                                            $ele.attr("title", $ele.text());
                                        }
                                    });
                                },
                                searchEnabled: true,
                                showClearButton: true,
                                showDropDownButton: true,
                                showSelectionControls: true,
                            },
                            editorType: "dxTagBox",
                            label: {
                                text: "Tên tuyến"
                            },
                        }, {
                            dataField: "districtCode",
                            editorOptions: {
                                dataSource: new DataSource({
                                    key: "area_id",
                                    store: new CustomStore({
                                        key: "area_id",
                                        load: async () => {
                                            return await AreaService.districts();
                                        },
                                        loadMode: "raw"
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
                                text: "Quận/Huyện"
                            },
                        });
                        break;
                    case EnumReportType.ThongKeSoLuong.id:
                        items.push({
                            dataField: "layer_id",
                            editorOptions: {
                                dataSource: {
                                    group: "table.table_schema",
                                    store: new CustomStore({
                                        key: "id",
                                        load: (loadOptions) => {
                                            const deferred = $.Deferred();
                                            $.get("/api/layer/getLayers").done((result) => {
                                                if (result.status == "OK") {
                                                    const data = result.data;
                                                    deferred.resolve(data);
                                                } else {
                                                    deferred.resolve([]);
                                                }
                                            });
                                            return deferred.promise();
                                        },
                                        loadMode: "raw",
                                    }),
                                },
                                deferRendering: true,
                                displayExpr: "name_vn",
                                grouped: true,
                                height: 32,
                                maxDisplayedTags: 1,
                                multiline: false,
                                noDataText: "Không có dữ liệu",
                                onContentReady: () => {
                                    $(".dx-list-item-content").each(function () {
                                        const $ele = $(this);
                                        if (this.offsetWidth < this.scrollWidth) {
                                            $ele.attr("title", $ele.text());
                                        }
                                    });
                                },
                                onSelectionChanged: (e) => {
                                    const selectedItems = e.component.option("selectedItems");
                                    if (selectedItems) {
                                        const groupBySelectBox = this.filterForm.getEditor("group_by") as dxSelectBox;
                                        if (groupBySelectBox) {
                                            if (selectedItems.length === 1) {
                                                groupBySelectBox.option("disabled", false);
                                            } else {
                                                groupBySelectBox.option("disabled", true);
                                            }
                                            groupBySelectBox.getDataSource().reload();
                                            groupBySelectBox.reset();
                                        }
                                    }
                                },
                                searchEnabled: true,
                                searchExpr: ["name_vn"],
                                searchMode: "contains",
                                showClearButton: true,
                                showDropDownButton: true,
                                showSelectionControls: true,
                                valueExpr: "id",
                            },
                            editorType: "dxTagBox",
                            label: {
                                text: "Lớp dữ liệu"
                            },
                            validationRules: [{
                                message: "Vui lòng chọn ít nhất 1 lớp dữ liệu",
                                type: "required"
                            }]
                        }, {
                            dataField: "group_by",
                            editorOptions: {
                                dataSource: new DataSource({
                                    store: new CustomStore({
                                        key: "column_name",
                                        load: (loadOptions) => {
                                            const deferred = $.Deferred();
                                            const layerTagBox = this.filterForm.getEditor("layer_id") as dxTagBox;
                                            const layerSelected = layerTagBox.option("selectedItems");
                                            if (layerSelected && layerSelected.length) {
                                                TableColumnService.list(layerSelected[0].table.id, true).then(result => {
                                                    if (result && result.status == EnumStatus.OK) {
                                                        deferred.resolve(result.data);
                                                    } else {
                                                        deferred.resolve([]);
                                                    }
                                                });
                                            } else {
                                                deferred.resolve([]);
                                            }
                                            return deferred.promise();
                                        },
                                        loadMode: "raw"
                                    }),
                                }),
                                disabled: true,
                                displayExpr: "name_vn",
                                searchEnabled: true,
                                searchExpr: ["name_vn"],
                                searchMode: "contains",
                                valueExpr: "column_name"
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Nhóm theo"
                            },
                        });
                        items.push({
                            dataField: "textSearch",
                            editorOptions: {

                            },
                            editorType: "dxTextBox",
                            label: {
                                text: "Tuyến"
                            },
                        }, {
                            dataField: "districtCode",
                            editorOptions: {
                                dataSource: new DataSource({
                                    key: "area_id",
                                    store: new CustomStore({
                                        key: "area_id",
                                        load: async () => {
                                            return await AreaService.districts();
                                        },
                                        loadMode: "raw"
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
                                text: "Quận/Huyện"
                            },
                        });
                        break;
                    case EnumReportType.TongHopThoatNuoc.id:
                        items.push({
                            dataField: "districtCode",
                            editorOptions: {
                                dataSource: new DataSource({
                                    key: "area_id",
                                    store: new CustomStore({
                                        key: "area_id",
                                        load: async () => {
                                            return await AreaService.districts();
                                        },
                                        loadMode: "raw"
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
                                text: "Quận/Huyện"
                            },
                        });
                        break;
                    case EnumReportType.ThongKeCayXanhTheoTuyen.id:
                        items.push({
                            dataField: "textSearch",
                            editorOptions: {
                                dataSource: {
                                    pageSize: 25,
                                    paginate: true,
                                    store: new CustomStore({
                                        load: (options) => {
                                            return new Promise((resolve) => {
                                                // Dropdown tentuyen - tuyenid
                                                ReportService.listDistinctValues("cx_tuyen", options.searchValue, (options.skip / options.take) + 1, options.take).then(data => {
                                                    resolve({
                                                        data: data.data,
                                                        totalCount: data.recordsTotal
                                                    });
                                                });
                                            });
                                        },
                                    })
                                },
                                deferRendering: true,
                                maxDisplayedTags: 1,
                                multiline: false,
                                noDataText: "Không có dữ liệu",
                                onContentReady: () => {
                                    $(".dx-list-item-content").each(function () {
                                        const $ele = $(this);
                                        if (this.offsetWidth < this.scrollWidth) {
                                            $ele.attr("title", $ele.text());
                                        }
                                    });
                                },
                                searchEnabled: true,
                                showClearButton: true,
                                showDropDownButton: true,
                                showSelectionControls: true,
                            },
                            editorType: "dxTagBox",
                            label: {
                                text: "Tên tuyến"
                            },
                            validationRules: [{
                                message: "Vui lòng nhập ít nhất một tuyến thống kê",
                                type: "required"
                            }],
                        }, {
                            dataField: "districtCode",
                            editorOptions: {
                                dataSource: new DataSource({
                                    key: "area_id",
                                    store: new CustomStore({
                                        key: "area_id",
                                        load: async () => {
                                            return await AreaService.districts();
                                        },
                                        loadMode: "raw"
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
                                text: "Quận/Huyện"
                            },
                        });
                        break;
                    case EnumReportType.ThongKeChieuSangTheoTuyen.id:
                        items.push({
                            dataField: "textSearch",
                            editorOptions: {
                                dataSource: {
                                    pageSize: 25,
                                    paginate: true,
                                    store: new CustomStore({
                                        load: (options) => {
                                            return new Promise((resolve) => {
                                                // Dropdown tentuyen - tuyenid
                                                ReportService.listDistinctValues("cs_tuyen", options.searchValue, (options.skip / options.take) + 1, options.take).then(data => {
                                                    resolve({
                                                        data: data.data,
                                                        totalCount: data.recordsTotal
                                                    });
                                                });
                                            });
                                        },
                                    })
                                },
                                deferRendering: true,
                                maxDisplayedTags: 1,
                                multiline: false,
                                noDataText: "Không có dữ liệu",
                                onContentReady: () => {
                                    $(".dx-list-item-content").each(function () {
                                        const $ele = $(this);
                                        if (this.offsetWidth < this.scrollWidth) {
                                            $ele.attr("title", $ele.text());
                                        }
                                    });
                                },
                                searchEnabled: true,
                                showClearButton: true,
                                showDropDownButton: true,
                                showSelectionControls: true,
                            },
                            editorType: "dxTagBox",
                            label: {
                                text: "Tên tuyến"
                            },

                        }, {
                            dataField: "districtCode",
                            editorOptions: {
                                dataSource: new DataSource({
                                    key: "area_id",
                                    store: new CustomStore({
                                        key: "area_id",
                                        load: async () => {
                                            return await AreaService.districts();
                                        },
                                        loadMode: "raw"
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
                                text: "Quận/Huyện"
                            },
                        });
                        break;
                    case EnumReportType.ThongKeChieuSangTheoTramDen.id:
                        items.push({
                            dataField: "textSearch",
                            editorOptions: {
                                dataSource: {
                                    pageSize: 25,
                                    paginate: true,
                                    store: new CustomStore({
                                        load: (options) => {
                                            return new Promise((resolve) => {
                                                ReportService.listDistinctValues("cs_tramden", options.searchValue, (options.skip / options.take) + 1, options.take).then(data => {
                                                    resolve({
                                                        data: data.data,
                                                        totalCount: data.recordsTotal
                                                    });
                                                });
                                            });
                                        },
                                    })
                                },
                                deferRendering: true,
                                maxDisplayedTags: 1,
                                multiline: false,
                                noDataText: "Không có dữ liệu",
                                onContentReady: () => {
                                    $(".dx-list-item-content").each(function () {
                                        const $ele = $(this);
                                        if (this.offsetWidth < this.scrollWidth) {
                                            $ele.attr("title", $ele.text());
                                        }
                                    });
                                },
                                searchEnabled: true,
                                showClearButton: true,
                                showDropDownButton: true,
                                showSelectionControls: true,
                            },
                            editorType: "dxTagBox",
                            label: {
                                text: "Tên trạm đèn"
                            },

                        }, {
                            dataField: "districtCode",
                            editorOptions: {
                                dataSource: new DataSource({
                                    key: "area_id",
                                    store: new CustomStore({
                                        key: "area_id",
                                        load: async () => {
                                            return await AreaService.districts();
                                        },
                                        loadMode: "raw"
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
                                text: "Quận/Huyện"
                            },
                        });
                        break;
                    case EnumReportType.ThongKeThoatNuocTheoTuyen.id:
                        items.push({
                            dataField: "textSearch",
                            editorOptions: {
                                dataSource: {
                                    pageSize: 25,
                                    paginate: true,
                                    store: new CustomStore({
                                        load: (options) => {
                                            return new Promise((resolve) => {
                                                // Dropdown tenho - lớp tn_hodieuhoa
                                                ReportService.listDistinctValues("tn_hodieuhoa", options.searchValue, (options.skip / options.take) + 1, options.take).then(data => {
                                                    resolve({
                                                        data: data.data,
                                                        totalCount: data.recordsTotal
                                                    });
                                                });
                                            });
                                        },
                                    })
                                },
                                searchEnabled: true,
                                showClearButton: true
                            },
                            editorType: "dxSelectBox",
                            // editorType: "dxTextBox",
                            label: {
                                text: "Tên hồ"
                            },
                        }, {
                            dataField: "districtCode",
                            editorOptions: {
                                dataSource: new DataSource({
                                    key: "area_id",
                                    store: new CustomStore({
                                        key: "area_id",
                                        load: async () => {
                                            return await AreaService.districts();
                                        },
                                        loadMode: "raw"
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
                                text: "Quận/Huyện"
                            },
                        });
                        break;
                    case EnumReportType.ThongKeThoatNuocTheoHo.id:
                        items.push({
                            dataField: "textSearch",
                            editorOptions: {
                                dataSource: {
                                    pageSize: 25,
                                    paginate: true,
                                    store: new CustomStore({
                                        load: (options) => {
                                            return new Promise((resolve) => {
                                                // Dropdown tenho - lớp tn_hodieuhoa
                                                ReportService.listDistinctValues("tn_hodieuhoa", options.searchValue, (options.skip / options.take) + 1, options.take).then(data => {
                                                    resolve({
                                                        data: data.data,
                                                        totalCount: data.recordsTotal
                                                    });
                                                });
                                            });
                                        },
                                    })
                                },
                                searchEnabled: true,
                                showClearButton: true
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Tên hồ"
                            },
                        }, {
                            dataField: "districtCode",
                            editorOptions: {
                                dataSource: new DataSource({
                                    key: "area_id",
                                    store: new CustomStore({
                                        key: "area_id",
                                        load: async () => {
                                            return await AreaService.districts();
                                        },
                                        loadMode: "raw"
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
                                text: "Quận/Huyện"
                            },
                        });
                        break;
                    case EnumReportType.ThongKePhanLoaiCongThoatNuoc.id:
                        items.push({
                            dataField: "textSearch",
                            editorOptions: {
                                dataSource: {
                                    pageSize: 25,
                                    paginate: true,
                                    store: new CustomStore({
                                        load: (options) => {
                                            return new Promise((resolve) => {
                                                // Dropdown tenho - lớp tn_hodieuhoa
                                                ReportService.listDistinctValues("tn_hodieuhoa", options.searchValue, (options.skip / options.take) + 1, options.take).then(data => {
                                                    resolve({
                                                        data: data.data,
                                                        totalCount: data.recordsTotal
                                                    });
                                                });
                                            });
                                        },
                                    })
                                },
                                searchEnabled: true,
                                showClearButton: true
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Tên hồ"
                            },
                        }, {
                            dataField: "districtCode",
                            editorOptions: {
                                dataSource: new DataSource({
                                    key: "area_id",
                                    store: new CustomStore({
                                        key: "area_id",
                                        load: async () => {
                                            return await AreaService.districts();
                                        },
                                        loadMode: "raw"
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
                                text: "Quận/Huyện"
                            },
                        });
                        break;
                    case EnumReportType.SoLuongCayXanh.id:
                        items.push({
                            dataField: "group_by",
                            editorOptions: {
                                dataSource: [{
                                    "id": "HANHCHINH",
                                    "text": "Hành chính",
                                }, {
                                    "id": "MATUYEN",
                                    "text": "Mã tuyến",
                                }, {
                                    "id": "LOAICAY",
                                    "text": "Loại cây",
                                }],
                                displayExpr: "text",
                                valueExpr: "id",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Nhóm theo"
                            },
                        });
                        items.push({
                            dataField: "districtCode",
                            editorOptions: {
                                dataSource: new DataSource({
                                    key: "area_id",
                                    store: new CustomStore({
                                        key: "area_id",
                                        load: async () => {
                                            return await AreaService.districts();
                                        },
                                        loadMode: "raw"
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
                                text: "Quận/Huyện"
                            },
                        });
                        break;
                    case EnumReportType.SoLuongHoGa.id:
                    case EnumReportType.SoLuongCongThoatNuoc.id:
                        items.push({
                            dataField: "group_by",
                            editorOptions: {
                                dataSource: [{
                                    "id": "HANHCHINH",
                                    "text": "Hành chính",
                                }, {
                                    "id": "MATUYEN",
                                    "text": "Mã tuyến",
                                }],
                                displayExpr: "text",
                                valueExpr: "id",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Nhóm theo"
                            },
                        });
                        items.push({
                            dataField: "districtCode",
                            editorOptions: {
                                dataSource: new DataSource({
                                    key: "area_id",
                                    store: new CustomStore({
                                        key: "area_id",
                                        load: async () => {
                                            return await AreaService.districts();
                                        },
                                        loadMode: "raw"
                                    }),
                                }),
                                displayExpr: "name_vn",
                                searchEnabled: true,
                                searchExpr: ["name_vn"],
                                searchMode: "contains",
                                showClearButton: true,
                                valueExpr: "area_id"
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Quận/Huyện"
                            },
                        });
                        break;
                    default:
                        break;
                }
                items.push({
                    colSpan: 3,
                    template: (itemData, itemElement) => {
                        this.reportToolbarBieuMau = $("<div  />").appendTo(itemElement)
                            .dxToolbar({
                                items: [{
                                    location: "center",
                                    options: {
                                        icon: "icon icon-login",
                                        onClick: () => {
                                            const validate = self.filterForm.validate();
                                            if (validate && validate.brokenRules.length === 0) {
                                                this.pageIndex = 1;
                                                this.pageSize = 25;
                                                this.reportTableToolbar.resetOption("items[0].options.totalCount");
                                                this.getReport();
                                            }
                                        },
                                        stylingMode: "contained",
                                        text: "Xuất báo cáo",
                                        type: "default"
                                    },
                                    widget: "dxButton"
                                }, {
                                    location: "center",
                                    options: {
                                        icon: "icon icon-receive-square",
                                        onClick: () => {
                                            this.exportReportToExcel();
                                        },
                                        stylingMode: "contained",
                                        text: "Xuất Excel",
                                        type: "danger"
                                    },
                                    widget: "dxButton"
                                },]
                            }).css("padding", "10px").dxToolbar("instance");
                    }
                });
                return items;
            case "chart":
                items.push({
                    template: () => {
                        return "<hr style=\"margin: 5px 0;\" />";
                    }
                });
                switch (report_id) {
                    case EnumChartType.SoLuong.id:
                        break;
                    case EnumChartType.SoLuongSuCo.id:
                    case EnumChartType.SoLuongBaoTriBaoDuong.id:
                        items.push({
                            dataField: "group_by",
                            editorOptions: {
                                dataSource: [{
                                    "id": "DIABAN",
                                    "text": "Địa bàn",
                                }, {
                                    "id": "LOAICONGTRINH",
                                    "text": "Loại công trình",
                                }],
                                displayExpr: "text",
                                valueExpr: "id",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Nhóm theo"
                            },
                        });
                        break;
                    case EnumChartType.SoLuongHoSo.id:
                        items.push({
                            dataField: "group_by",
                            editorOptions: {
                                dataSource: [{
                                    "id": "TINHTRANG",
                                    "text": "Tình trạng",
                                }, {
                                    "id": "LOAINHA",
                                    "text": "Loại nhà",
                                }],
                                displayExpr: "text",
                                valueExpr: "id",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Nhóm theo"
                            },
                        });
                        break;
                    default:
                        break;
                }
                items.push({
                    dataField: "chart_type",
                    editorOptions: {
                        dataSource: [{
                            id: "bar-chart",
                            name: "Biểu đồ cột"
                        }, {
                            id: "pie-chart",
                            name: "Biểu đồ tròn"
                        }],
                        displayExpr: "name",
                        placeholder: "[Chọn ...]",
                        showClearButton: true,
                        valueExpr: "id",
                    },
                    editorType: "dxSelectBox",
                    label: {
                        text: "Loại biểu đồ"
                    },
                }, {
                    template: (itemData, itemElement) => {
                        $("<div />").appendTo(itemElement)
                            .dxToolbar({
                                items: [{
                                    location: "center",
                                    options: {
                                        icon: "icon icon-login",
                                        onClick: () => {
                                            this.getCustomChartData().then(result => {
                                                let title = this.selectedReportType.text;
                                                const groupBySelectBox = this.filterForm.getEditor("group_by") as dxSelectBox;
                                                if (groupBySelectBox) {
                                                    const groupBy = groupBySelectBox.option("displayValue");
                                                    if (groupBy) {
                                                        title = title + " theo " + groupBy.toLowerCase();
                                                    }
                                                }
                                                this.getChartReport({
                                                    chart_type: this.filterForm.option("formData").chart_type,
                                                    data: result,
                                                    title: title
                                                });
                                            });
                                        },
                                        stylingMode: "contained",
                                        text: "Xuất biểu đồ",
                                        type: "default"
                                    },
                                    widget: "dxButton"
                                },]
                            }).css("padding", "10px").dxToolbar("instance");
                    }
                });
                return items;
            default:
                return [];
        }
    }

    private getReport(): void {
        const self = this;
        const idReport = this.reportOptionsTreeView.option("selectedItem").id;
        const pageSize = this.pageSize, pageIndex = this.pageIndex;
        //
        this.reportView.option("selectedIndex", 0);
        const dateEditor = this.filterForm.getEditor("date");
        let dateStart, dateEnd;
        if (dateEditor) {
            dateStart = dateEditor.option("startDate") ? moment(dateEditor.option("startDate")).format("YYYY-MM-DD") : null;
            dateEnd = dateEditor.option("endDate") ? moment(dateEditor.option("endDate")).format("YYYY-MM-DD") : null;
        }
        const layerIds = this.filterForm.option("formData").layer_id;
        const groupBy = this.filterForm.option("formData").group_by;
        let textSearch = "";
        const textSearchEditor = this.filterForm.getEditor("textSearch");
        if (textSearchEditor) {
            if (textSearchEditor instanceof dxTagBox) {
                textSearch = this.filterForm.option("formData").textSearch?.toString();
            } else if (textSearchEditor instanceof dxSelectBox) {
                textSearch = this.filterForm.option("formData").textSearch;
            }
        }

        if (layerIds && (layerIds.length == 1) && !groupBy) {
            OGUtils.alert("Vui lòng chọn kiểu nhóm thống kê dữ liệu!");
        } else {
            const param = {
                communeCode: this.filterForm.option("formData").communeCode,
                dateEnd: dateEnd,
                dateStart: dateStart,
                districtCode: this.filterForm.option("formData").districtCode,
                groupBy: this.filterForm.option("formData").group_by,
                layerIds: this.filterForm.option("formData").layer_id,
                pageIndex: pageIndex,
                pageSize: pageSize,
                reportType: idReport,
                textSearch: textSearch,
            };
            OGUtils.showLoading();
            self.getData(param).then(res => {
                OGUtils.hideLoading();
                if (res) {
                    this.loadReport(res);
                }
            });
        }
    }

    private initLayout(): void {
        const self = this;
        this.mainAccordionContainer = $("<div />").appendTo(this.container).height("100%").css("width", "360px").css("float", "left");
        this.reportContainer = $("<div />").appendTo(this.container).height(window.innerHeight - $("#header").outerHeight() - 15)
            .css("margin-left", "360px").css("border-left", "1px solid #ddd");

        this.initReportOptionsTree();
        this.initReportView();
    }

    private initReportOptionsTree(): void {
        const self = this;
        this.reportOptionsTreeView = $("<div style='padding:0 5px;'/>").appendTo(this.mainAccordionContainer).dxTreeView({
            dataSource: [{
                expanded: true,
                icon: "icon icon-menu-1",
                id: "report_tree",
                items: [{
                    expanded: true,
                    icon: "icon icon-document",
                    id: "table",
                    items: [
                        //     {
                        //     icon: "icon icon-document",
                        //     id: EnumReportType.SoLuong.id,
                        //     text: EnumReportType.SoLuong.title,
                        //     type: "table"
                        // }, {
                        //     icon: "icon icon-document",
                        //     id: EnumReportType.SoLuongSuCo.id,
                        //     text: EnumReportType.SoLuongSuCo.title,
                        //     type: "table"
                        // }, {
                        //     icon: "icon icon-document",
                        //     id: EnumReportType.SoLuongBaoTriBaoDuong.id,
                        //     text: EnumReportType.SoLuongBaoTriBaoDuong.title,
                        //     type: "table"
                        // }, {
                        //     icon: "icon icon-document",
                        //     id: EnumReportType.TinhTrangHoSo.id,
                        //     text: EnumReportType.TinhTrangHoSo.title,
                        //     type: "table"
                        // }, {
                        //     icon: "icon icon-document",
                        //     id: EnumReportType.SoLuongHoSo.id,
                        //     text: EnumReportType.SoLuongHoSo.title,
                        //     type: "table"
                        // }, {
                        //     icon: "icon icon-document",
                        //     id: EnumReportType.DuyetHoSoMoiNhat.id,
                        //     text: EnumReportType.DuyetHoSoMoiNhat.title,
                        //     type: "table"
                        // }, {
                        //     icon: "icon icon-document",
                        //     id: EnumReportType.ThongKeSoLuong.id,
                        //     text: EnumReportType.ThongKeSoLuong.title,
                        //     type: "table"
                        // }, 
                        {
                            expanded: true,
                            icon: "icon icon-document",
                            id: "urban-green",
                            items: [
                                {
                                    icon: "icon icon-document",
                                    id: EnumReportType.ThongKeCayXanhTheoTuyen.id,
                                    text: EnumReportType.ThongKeCayXanhTheoTuyen.title,
                                    type: "table"
                                },
                            ],
                            text: "Cây xanh",
                            type: "group"
                        }, {
                            expanded: true,
                            icon: "icon icon-document",
                            id: "urban-lighting",
                            items: [
                                {
                                    icon: "icon icon-document",
                                    id: EnumReportType.ThongKeChieuSangTheoTuyen.id,
                                    text: EnumReportType.ThongKeChieuSangTheoTuyen.title,
                                    type: "table"
                                }, {
                                    icon: "icon icon-document",
                                    id: EnumReportType.ThongKeChieuSangTheoTramDen.id,
                                    text: EnumReportType.ThongKeChieuSangTheoTramDen.title,
                                    type: "table"
                                }, {
                                    icon: "icon icon-document",
                                    id: EnumReportType.ChieuDaiTuyenCap.id,
                                    text: EnumReportType.ChieuDaiTuyenCap.title,
                                    type: "table"
                                },
                            ],
                            text: "Chiếu sáng",
                            type: "group"
                        }, {
                            expanded: true,
                            icon: "icon icon-document",
                            id: "urban-drainage",
                            items: [
                                {
                                    icon: "icon icon-document",
                                    id: EnumReportType.TongHopThoatNuoc.id,
                                    text: EnumReportType.TongHopThoatNuoc.title,
                                    type: "table"
                                }, {
                                    icon: "icon icon-document",
                                    id: EnumReportType.ThongKeThoatNuocTheoTuyen.id,
                                    text: EnumReportType.ThongKeThoatNuocTheoTuyen.title,
                                    type: "table"
                                }, {
                                    icon: "icon icon-document",
                                    id: EnumReportType.ThongKeThoatNuocTheoHo.id,
                                    text: EnumReportType.ThongKeThoatNuocTheoHo.title,
                                    type: "table"
                                }, {
                                    icon: "icon icon-document",
                                    id: EnumReportType.ThongKePhanLoaiCongThoatNuoc.id,
                                    text: EnumReportType.ThongKePhanLoaiCongThoatNuoc.title,
                                    type: "table"
                                }, {
                                    icon: "icon icon-document",
                                    id: EnumReportType.ChieuDaiCongThoatNuoc.id,
                                    text: EnumReportType.ChieuDaiCongThoatNuoc.title,
                                    type: "table"
                                },
                            ],
                            text: "Thoát nước",
                            type: "group"
                        },],
                    text: "Báo cáo",
                    type: "table",
                }, {
                    expanded: true,
                    icon: "icon icon-chart-1",
                    id: "chart",
                    items: [{
                        icon: "icon icon-chart-1",
                        id: EnumChartType.SoLuong.id,
                        text: EnumChartType.SoLuong.title,
                        type: "chart"
                    }, {
                        icon: "icon icon-chart-1",
                        id: EnumChartType.SoLuongSuCo.id,
                        text: EnumChartType.SoLuongSuCo.title,
                        type: "chart"
                    }, {
                        icon: "icon icon-chart-1",
                        id: EnumChartType.SoLuongBaoTriBaoDuong.id,
                        text: EnumChartType.SoLuongBaoTriBaoDuong.title,
                        type: "chart"
                    }, {
                        icon: "icon icon-chart-1",
                        id: EnumChartType.SoLuongHoSo.id,
                        text: EnumChartType.SoLuongHoSo.title,
                        type: "chart"
                    }],
                    text: "Biểu đồ",
                },],
                text: "Danh sách báo cáo",
            },],
            displayExpr: "text",
            focusStateEnabled: true,
            height: "50vh",
            keyExpr: "id",
            onItemClick: function (e) {
                e.component.option("selectedItem", e.itemData);
                self.selectedReportType = e.itemData;
                self.filterForm.resetValues();
                self.filterForm.beginUpdate();
                self.filterForm.option("items", self.getFilterFormItems(self.selectedReportType.type, self.selectedReportType.id));
                self.filterForm.option("formData", self.formDataFilter);
                self.filterForm.repaint();
                self.filterForm.endUpdate();
                if (self.selectedReportType.type == "chart") {
                    self.reportView.option("selectedIndex", 1);
                } else if (self.selectedReportType.type == "table") {
                    self.reportView.option("selectedIndex", 0);
                } else if (self.selectedReportType.type == "thematic") {
                    self.reportView.option("selectedIndex", 2);
                }

            }
        }).dxTreeView("instance");
        this.filterFormScrollView = $("<div />").appendTo(this.mainAccordionContainer);
        this.filterForm = $("<div />").css({
            "padding": "0 5px",
        }).appendTo(this.filterFormScrollView)
            .dxForm({
                formData: {},
                items: [],
                labelMode: "floating",
                onContentReady: () => {
                },
                showColonAfterLabel: true,
                width: "100%",
            }).dxForm("instance");
        this.filterFormScrollView.dxScrollView({
            height: this.mainAccordionContainer.height() - this.reportOptionsTreeView.element().outerHeight()
        });
    }

    private initReportView(): void {
        const self = this;
        this.reportView = $("<div />").appendTo(this.reportContainer)
            .dxMultiView({
                deferRendering: true,
                height: "100%",
                items: [{
                    template: (data, index, element) => {
                        // thematic
                        this.reportTableToolbar = $("<div />").css("padding", "10px").appendTo(element)
                            .dxToolbar({
                                dataSource: [{
                                    location: "before",
                                    options: {
                                        pageIndex: this.pageIndex,
                                        pageIndexChanged: (e) => {
                                            this.reportTableToolbar.resetOption("items[0].options.totalCount");
                                            this.pageIndex = e;
                                            this.getReport();
                                        },
                                        pageSize: this.pageSize,
                                        pageSizeChanged: (e) => {
                                            this.reportTableToolbar.resetOption("items[0].options.totalCount");
                                            this.pageSize = e;
                                            this.pageIndex = 1;
                                            this.getReport();
                                        },
                                        pageSizes: [25, 50, 100],
                                        showInfo: true,
                                        visible: false
                                    },
                                    widget: "dxPager"
                                },]
                            }).dxToolbar("instance");
                        this.reportTableIframe = $("<iframe />")
                            .prop("frameborder", "0")
                            .css({
                                "height": (element.height() - this.reportTableToolbar.element().outerHeight() - 20).toString() + "px",
                                "overflow": "hidden",
                                "padding": "10px 0",
                                "width": "100%",
                            })
                            .appendTo($(element));
                    }
                }, {
                    template: (data, index, element) => {
                        this.chartContainer = element;
                    }
                }]
            }).dxMultiView("instance");
    }
    private loadReport(res): void {
        this.reportTableIframe[0]["contentWindow"].document.open();
        if (res.content) {
            this.reportTableIframe[0]["contentWindow"].document.write(res.content);
        }
        this.reportTableIframe[0]["contentWindow"].document.close();
        let pageCount = 0;
        if (res.totalCount % this.pageSize == 0) {
            pageCount = Math.floor(res.totalCount / this.pageSize);
        } else {
            pageCount = Math.floor(res.totalCount / this.pageSize) + 1;
        }
        this.reportTableToolbar.beginUpdate();
        this.reportTableToolbar.option("items[0].options.visible", res.showToolbar);
        this.reportTableToolbar.option("items[0].options.pageIndex", this.pageIndex);
        this.reportTableToolbar.option("items[0].options.pageSize", this.pageSize);
        this.reportTableToolbar.option("items[0].options.pageCount", pageCount);
        this.reportTableToolbar.option("items[0].options.totalCount", res.totalCount);
        this.reportTableToolbar.endUpdate();
    }
    public groupBy(list, keyGetter): Map<string, OGLayerModel[]> {
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
        return map;
    }
    onInit(): void {
        $(".tab-item-container").css({
            "background-color": "white"
        }).height(window.innerHeight - $("#header").outerHeight());

        this.initLayout();
    }
    parseDataReport(records, columns, counter, addedData = null): unknown {
        const result = [];
        let stt = counter;
        records.forEach(item => {
            const items = [];
            stt++;
            items.push(stt);
            columns.forEach(col => {
                const valueCell = item[col.ags_field_name];
                if (col.is_added_field) {
                    if (addedData) {
                        items.push(addedData);
                    }
                    else {
                        items.push("");
                    }
                }
                else if (col.ags_field_type == EnumDataType.date || col.data_type == EnumDataType.dateTime) {
                    if (valueCell) {
                        items.push(new Date(valueCell).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                        }));
                    } else {
                        items.push("");
                    }
                }
                else if (col.ags_field_type === EnumDataType.bool) {
                    if (item[col.ags_field_name] == true) {
                        items.push("Có");
                    } else if (item[col.ags_field_name] == false)
                        items.push("Không");
                    else {
                        items.push("");
                    }
                }
                //else if (col.ags_field_type === EnumDataType.double) {
                //    if (valueCell) {
                //        items.push(parseFloat(valueCell).toFixed(2));
                //    } else {
                //        items.push("");
                //    }
                //}
                else {
                    if (valueCell) {
                        items.push(item[col.ags_field_name]);
                    } else {
                        items.push("");
                    }
                }
            });
            result.push(items);
        });
        return result;
    }
}

