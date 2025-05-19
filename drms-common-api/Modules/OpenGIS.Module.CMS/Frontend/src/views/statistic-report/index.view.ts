import axios, { Axios } from "axios";
import CustomStore, { ResolvedData } from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import "devextreme/ui/button";
import dxDateRangeBox from "devextreme/ui/date_range_box";
import "devextreme/ui/date_range_box";
import dxForm from "devextreme/ui/form";
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
import { disable } from "ol/rotationconstraint";
import { optionsFromCapabilities } from "ol/source/WMTS";

import ThematicReportComponent from "../../../../../libs/core/components/thematic-report/thematic-report.component";
import { RazorView } from "../../../../../libs/core/decorators/razor-view.decorator";
import { EnumChartType, EnumDataType, EnumMap, EnumReportType, EnumStatus, EnumThongKePhanLoai, EnumsFunction } from "../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../libs/core/helpers/utils";
import { Layout } from "../../../../../libs/core/layout";
import { RestError } from "../../../../../libs/core/models/base-response.model";
import { OGLayerModel } from "../../../../../libs/core/models/layer.model";
import { OGSynthesisReportModel } from "../../../../../libs/core/models/report.model";
import { AreaService } from "../../../../../libs/core/services/area.service";
import { ReportService } from "../../../../../libs/core/services/report.service";
import { TableColumnService, TableService } from "../../../../../libs/core/services/table.service";
import "./index.view.scss";

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
    selectedReportType: OGSynthesisReportModel;
    thematicReport: ThematicReportComponent;
    thematicReportTree: dxTreeView;
    constructor() {
        super("child", "Báo cáo thống kê");
        this.pageIndex = 1;
        this.pageSize = 25;
        this.container = $("#report-container");
        // this.schemaCayXanh = "csdl_cayxanh";
    }

    // private exportReportToExcel(): void {
    //     const dateEditor = this.filterForm.getEditor("date");
    //     let dateStart, dateEnd;
    //     if (dateEditor) {
    //         dateStart = dateEditor.option("startDate") ? moment(dateEditor.option("startDate")).format("YYYY-MM-DD") : null;
    //         dateEnd = dateEditor.option("endDate") ? moment(dateEditor.option("endDate")).format("YYYY-MM-DD") : null;
    //     }

    //     let groupName = "";
    //     const groupBySelectBox = this.filterForm.getEditor("group_by") as dxSelectBox;
    //     if (groupBySelectBox) {
    //         groupName = groupBySelectBox.option("displayValue");
    //     }
    //     let layer_ids: number[] = [];
    //     const layerSelectBox = this.filterForm.getEditor("layer_id") as dxSelectBox;
    //     if (layerSelectBox) {
    //         layer_ids = this.filterForm.option("formData").layer_id;
    //     }
    //     let textSearch = "";
    //     const textSearchEditor = this.filterForm.getEditor("textSearch");
    //     if (textSearchEditor) {
    //         if (textSearchEditor instanceof dxTagBox) {
    //             textSearch = this.filterForm.option("formData").textSearch?.toString();
    //         } else if (textSearchEditor instanceof dxSelectBox) {
    //             textSearch = this.filterForm.option("formData").textSearch;
    //         }
    //     }
    //     const param = {
    //         communeCode: this.filterForm.option("formData").communeCode,
    //         dateEnd: dateEnd,
    //         dateStart: dateStart,
    //         districtCode: this.filterForm.option("formData").districtCode,
    //         groupBy: this.filterForm.option("formData").group_by,
    //         groupName: groupName,
    //         layerIds: layer_ids,
    //         reportType: this.selectedReportType.id,
    //         textSearch: textSearch,
    //         title: this.selectedReportType.text,
    //     };
    //     OGUtils.postDownload("/api/report/export-custom-report", param);
    // }

    // private getChartReport(options: object): void {
    //     if (this.chart) {
    //         this.chart.dispose();
    //         this.chartContainer.empty();
    //     }

    //     this.reportView.option("selectedIndex", 1);

    //     if (options["chart_type"] === "bar-chart" || options["chart_type"] === "line-chart") {
    //         this.chart = $("<div />").css("padding", "10px").css("height", "100%").appendTo(this.chartContainer).dxChart({
    //             // argumentAxis: { // or valueAxis, or commonAxisSettings
    //             //     label: {
    //             //         displayMode: "rotate",
    //             //         rotationAngle: "-45",
    //             //     },
    //             //     position: "center",
    //             // },
    //             commonSeriesSettings: {
    //                 argumentField: "detail",
    //                 ignoreEmptyPoints: true,
    //                 type: "bar",
    //                 valueField: "count",
    //             },
    //             dataSource: options["data"],
    //             export: {
    //                 enabled: true,
    //                 printingEnabled: true
    //             },
    //             legend: {
    //                 horizontalAlignment: "center",
    //                 paddingTopBottom: 50,
    //                 verticalAlignment: "bottom",
    //                 visible: true,
    //             },
    //             onLegendClick: (e) => {
    //                 if (e.target.isVisible()) {
    //                     e.target.hide();
    //                 } else {
    //                     e.target.show();
    //                 }
    //             },
    //             // palette: "soft",
    //             scrollBar: {
    //                 visible: true,
    //             },
    //             seriesTemplate: {
    //                 nameField: "description",
    //             },
    //             // size: {
    //             //     height: "100%",
    //             //     widht: "100%",
    //             // },
    //             title: {
    //                 font: {
    //                     family: "Open Sans, Helvetica Neue, Segoe UI, Helvetica, Verdana, sans-serif",
    //                     size: 20,
    //                     weight: 400
    //                 },
    //                 text: "Biểu đồ " + options["title"]
    //             },
    //             tooltip: {
    //                 contentTemplate: (info, container) => {
    //                     const raw = info.point.data;
    //                     //container.css({
    //                     //    'width': '40vw'
    //                     //});
    //                     return $("<b style=\" word-break: break-all; white-space: normal;\"/>").text(`${raw.description}: ${parseFloat(info.valueText).toLocaleString("vi-VN")} (${raw.donvitinh})`).appendTo(container);
    //                 },
    //                 enabled: true,
    //                 paddingLeftRight: 10,
    //                 paddingTopBottom: 5,
    //             },
    //             zoomAndPan: {
    //                 argumentAxis: "both",
    //             },
    //         }).dxChart("instance");
    //     } else if (options["chart_type"] === "pie-chart") {
    //         this.chart = $("<div  />").css("padding", "10px").css("height", "100%").appendTo(this.chartContainer).dxPieChart({
    //             // customizePoint: (e) => {
    //             //     if (options["colors"]) {
    //             //         return {
    //             //             color: options["colors"][e.argument]
    //             //         };
    //             //     }
    //             //     return {
    //             //         color: OGUtils.rainbow(options["data"].length, 5)
    //             //     };
    //             // },
    //             dataSource: {
    //                 store: options["data"]
    //             },
    //             series: [{
    //                 argumentField: "description",
    //                 label: {
    //                     connector: {
    //                         visible: true,
    //                         width: 1
    //                     },
    //                     customizeText(arg) {
    //                         return `${arg.valueText} (${arg.percentText})`;
    //                     },
    //                     visible: true,
    //                 },
    //                 name: "detail",
    //                 valueField: "count"
    //             }],
    //             // size: {
    //             //     height: "100%",
    //             //     widht: "100%",
    //             // },
    //             title: {
    //                 font: {
    //                     family: "'Reddit Sans', Open Sans, Helvetica Neue, Segoe UI, Helvetica, Verdana, sans-serif",
    //                     size: 20,
    //                     weight: 400
    //                 },
    //                 text: "Biểu đồ " + options["title"]
    //             },
    //             tooltip: {
    //                 contentTemplate: (info, container) => {
    //                     const raw = info.point.data;
    //                     return $("<b style=\" word-break: break-all; white-space: normal;\"/>").text(`${raw.description}: ${parseFloat(info.valueText).toLocaleString("vi-VN")} (${raw.donvitinh})`).appendTo(container);
    //                 },
    //                 enabled: true,
    //                 paddingLeftRight: 10,
    //                 paddingTopBottom: 5,
    //             }
    //         }).dxPieChart("instance");
    //     }
    // }
    // private getCustomChartData(): PromiseLike<ArrayLike<unknown>> {
    //     const def = $.Deferred();
    //     const groupBy = this.filterForm.option("formData").group_by;
    //     axios({
    //         data: {
    //             communeCode: this.filterForm.option("formData").communeCode,
    //             districtCode: this.filterForm.option("formData").districtCode,
    //             groupBy: groupBy,
    //             reportType: this.selectedReportType.id
    //         },
    //         method: "POST",
    //         url: "/api/report/custom-chart-data",
    //     }).then((xhr) => {
    //         if (xhr.data.status === EnumStatus.OK) {
    //             const data = xhr.data.data.result;
    //             def.resolve(data);
    //         }
    //         else {
    //             def.resolve([]);
    //             OGUtils.error(xhr.data["errors"][0].message);
    //         }
    //     });
    //     return def.promise();
    // }
    // private getData(options: object): PromiseLike<unknown> {
    //     const def = $.Deferred();
    //     const groupBySelectBox = this.filterForm.getEditor("group_by") as dxSelectBox;
    //     const layerTagBox = this.filterForm.getEditor("layer_id") as dxTagBox;
    //     axios({
    //         data: options,
    //         method: "POST",
    //         url: "/api/report/custom-report-data",
    //     }).then((xhr) => {
    //         if (xhr.data.status === "OK") {
    //             const data = xhr.data.data;
    //             let counter = this.pageSize * (this.pageIndex - 1);
    //             const showToolbar = true;
    //             let content;
    //             switch (options["reportType"]) {
    //                 case EnumReportType.SoLuong.id:
    //                     data.title = EnumReportType.SoLuong.title;
    //                     data.data.forEach(hoSoGroupByLoaiNha => {
    //                         hoSoGroupByLoaiNha.items.forEach(hoSoFroupByLoaiCongTrinh => {
    //                             hoSoFroupByLoaiCongTrinh.hoSos.forEach(hoSo => {
    //                                 hoSo.stt = ++counter;
    //                             });
    //                         });
    //                     });
    //                     content = Handlebars.compile(BaoCaoSoLuongTheoLoaiCongTrinhLoaiNhaTemp)(data);
    //                     break;
    //                 case EnumReportType.SoLuongSuCo.id:
    //                     data.title = EnumReportType.SoLuongSuCo.title;
    //                     data.data.forEach(item => {
    //                         item.stt = ++counter;
    //                     });
    //                     content = Handlebars.compile(BaoCaoTuyChonSuCoTemp)(data);
    //                     break;
    //                 case EnumReportType.SoLuongBaoTriBaoDuong.id:
    //                     data.title = EnumReportType.SoLuongBaoTriBaoDuong.title;
    //                     data.data.forEach(item => {
    //                         item.stt = ++counter;
    //                     });
    //                     content = Handlebars.compile(BaoCaoTuyChonBaoTriTemp)(data);
    //                     break;
    //                 case EnumReportType.TinhTrangHoSo.id:
    //                     data.title = EnumReportType.TinhTrangHoSo.title;
    //                     data.data.forEach(item => {
    //                         item.stt = ++counter;
    //                     });
    //                     content = Handlebars.compile(BaoCaoThongTinChungHoSoTemp)(data);
    //                     break;
    //                 case EnumReportType.SoLuongHoSo.id:
    //                     data.title = EnumReportType.SoLuongHoSo.title;
    //                     if (groupBySelectBox) {
    //                         const groupBy = groupBySelectBox.option("displayValue");
    //                         if (groupBy) {
    //                             data.title = data.title + " theo " + groupBy.toLowerCase();
    //                         }
    //                     }
    //                     data.data.forEach(item => {
    //                         item.hoSos.forEach(hoSo => {
    //                             hoSo.stt = ++counter;
    //                         });
    //                     });
    //                     content = Handlebars.compile(BaoCaoTuyChonHoSoTemp)(data);
    //                     break;
    //                 case EnumReportType.DuyetHoSoMoiNhat.id:
    //                     data.data.forEach(item => {
    //                         item.stt = ++counter;
    //                     });
    //                     data.title = EnumReportType.DuyetHoSoMoiNhat.title;
    //                     content = Handlebars.compile(BaoCaoThongTinChungHoSoTemp)(data);
    //                     break;
    //                 case EnumReportType.ChieuDaiTuyenCap.id:
    //                     data.title = EnumReportType.ChieuDaiTuyenCap.title;
    //                     data.data.forEach(item => {
    //                         item.items.forEach(child => {
    //                             child.stt = ++counter;
    //                         });
    //                     });
    //                     if (groupBySelectBox) {
    //                         const groupBy = groupBySelectBox.option("displayValue");
    //                         if (groupBy) {
    //                             data.title = data.title + " theo " + groupBy.toLowerCase();
    //                             if (groupBySelectBox.option("value") === "HANHCHINH") {
    //                                 data.group_name = "Phường/Xã";
    //                             } else {
    //                                 data.group_name = "Tuyến cáp";
    //                             }
    //                         }
    //                         content = Handlebars.compile(BaoCaoChieuDaiTemp)(data);
    //                     }
    //                     break;
    //                 case EnumReportType.ThongKeSoLuong.id:
    //                     if (groupBySelectBox) {
    //                         const groupBy = groupBySelectBox.option("displayValue");
    //                         const layerSelected = layerTagBox.option("selectedItems");
    //                         if (layerSelected.length == 1) {
    //                             const layerName = layerSelected[0].name_vn;
    //                             data.title = "Thống kê số lượng " + layerName.toLowerCase() + " theo " + groupBy.toLowerCase();
    //                             data.unit = "(" + layerName.toLowerCase() + ")";
    //                             data.group_name = groupBy;
    //                         } else {
    //                             data.title = "Thống kê số lượng tài sản theo tuyến";
    //                             data.group_name = "Công trình";
    //                         }
    //                         data.data.forEach(item => {
    //                             item.items.forEach(x => {
    //                                 x.stt = ++counter;
    //                                 if (!x.key) {
    //                                     item.description = "Không xác định";
    //                                 }
    //                             });
    //                         });
    //                         content = Handlebars.compile(BaoCaoSoLuongTemp)(data);
    //                     }
    //                     break;
    //                 case EnumReportType.ThongKeCayXanhTheoTuyen.id:
    //                     data.title = "Thống kê số lượng công trình cây xanh theo tuyến";
    //                     data.group_name = "Phân loại";
    //                     data.data.forEach(tuyen => {
    //                         tuyen.items.forEach(item => {
    //                             item.stt = ++counter;
    //                             item.count_row = item.items.length + 1;
    //                         });
    //                     });
    //                     content = Handlebars.compile(BaoCaoThongKeLoaiCongTrinhTemp)(data);
    //                     break;
    //                 case EnumReportType.ThongKeChieuSangTheoTuyen.id:
    //                     data.title = "Thống kê số lượng công trình chiếu sáng theo tuyến";
    //                     data.group_name = "Phân loại";
    //                     data.data.forEach(tuyen => {
    //                         tuyen.items.forEach(tram => {
    //                             tram.items.forEach(item => {
    //                                 item.stt = ++counter;
    //                                 item.count_row = item.items.length + 1;
    //                             });
    //                         });
    //                     });
    //                     content = Handlebars.compile(BaoCaoThongKeLoaiCongTrinhChieuSangTemp)(data);
    //                     break;
    //                 case EnumReportType.ThongKeChieuSangTheoTramDen.id:
    //                     data.title = EnumReportType.ThongKeChieuSangTheoTramDen.title;
    //                     data.group_name = "Phân loại";
    //                     data.data.forEach(tuyen => {
    //                         tuyen.items.forEach(tram => {
    //                             tram.items.forEach(item => {
    //                                 item.stt = ++counter;
    //                                 item.count_row = item.items.length + 1;
    //                             });
    //                         });
    //                     });
    //                     content = Handlebars.compile(BaoCaoThongKeLoaiCongTrinhChieuSangTemp)(data);
    //                     break;
    //                 case EnumReportType.ThongKeThoatNuocTheoTuyen.id:
    //                     data.title = "Thống kê số lượng công trình thoát nước theo tuyến";
    //                     data.group_name = "Phân loại";
    //                     data.data.forEach(tuyen => {
    //                         tuyen.items.forEach(item => {
    //                             item.stt = ++counter;
    //                             item.count_row = item.items.length + 1;
    //                         });
    //                     });
    //                     content = Handlebars.compile(BaoCaoThongKeLoaiCongTrinhTemp)(data);
    //                     break;
    //                 case EnumReportType.ThongKeThoatNuocTheoHo.id:
    //                     data.title = "Thống kê số lượng công trình thoát nước theo hồ";
    //                     data.group_name = "Phân loại";
    //                     data.data.forEach(tuyen => {
    //                         tuyen.items.forEach(item => {
    //                             item.stt = ++counter;
    //                             item.count_row = item.items.length + 1;
    //                         });
    //                     });
    //                     content = Handlebars.compile(BaoCaoThongKeLoaiCongTrinhTemp)(data);
    //                     break;
    //                 case EnumReportType.ThongKePhanLoaiCongThoatNuoc.id:
    //                     data.title = "Thống kê phân loại cống thoát nước";
    //                     data.group_name = "Tiết diện";
    //                     data.data.forEach(tuyen => {
    //                         tuyen.items.forEach(item => {
    //                             item.stt = ++counter;
    //                             item.count_row = item.items.length + 1;
    //                         });
    //                     });
    //                     content = Handlebars.compile(BaoCaoThongKeLoaiCongTrinhTemp)(data);
    //                     break;
    //                 case EnumReportType.SoLuongCayXanh.id:
    //                     data.title = EnumReportType.SoLuongCayXanh.title;
    //                     data.data.forEach(item => {
    //                         item.items.forEach(child => {
    //                             child.stt = ++counter;
    //                         });
    //                     });
    //                     if (groupBySelectBox) {
    //                         const groupBy = groupBySelectBox.option("displayValue");
    //                         if (groupBy) {
    //                             data.title = data.title + " theo " + groupBy.toLowerCase();
    //                             data.unit = "cây";
    //                             if (groupBySelectBox.option("value") === "HANHCHINH") {
    //                                 data.group_name = "Phường/Xã";
    //                             } else if (groupBySelectBox.option("value") === "MATUYEN") {
    //                                 data.group_name = "Tuyến đường";
    //                             } else {
    //                                 data.group_name = "Loại cây";
    //                             }
    //                         }
    //                         content = Handlebars.compile(BaoCaoSoLuongTemp)(data);
    //                     }
    //                     break;
    //                 case EnumReportType.SoLuongCongThoatNuoc.id:
    //                     data.title = EnumReportType.SoLuongCongThoatNuoc.title;
    //                     data.data.forEach(item => {
    //                         item.items.forEach(child => {
    //                             child.stt = ++counter;
    //                         });
    //                     });
    //                     if (groupBySelectBox) {
    //                         const groupBy = groupBySelectBox.option("displayValue");
    //                         if (groupBy) {
    //                             data.title = data.title + " theo " + groupBy.toLowerCase();
    //                             data.unit = "cống";
    //                             if (groupBySelectBox.option("value") === "HANHCHINH") {
    //                                 data.group_name = "Phường/Xã";
    //                             } else if (groupBySelectBox.option("value") === "MATUYEN") {
    //                                 data.group_name = "Tuyến";
    //                             } else {
    //                                 data.group_name = "Loại cống thoát nước";
    //                             }
    //                         }
    //                         content = Handlebars.compile(BaoCaoSoLuongTemp)(data);
    //                     }
    //                     break;
    //                 case EnumReportType.SoLuongHoGa.id:
    //                     data.title = EnumReportType.SoLuongHoGa.title;
    //                     data.data.forEach(item => {
    //                         item.items.forEach(child => {
    //                             child.stt = ++counter;
    //                         });
    //                     });
    //                     if (groupBySelectBox) {
    //                         const groupBy = groupBySelectBox.option("displayValue");
    //                         if (groupBy) {
    //                             data.title = data.title + " theo " + groupBy.toLowerCase();
    //                             data.unit = "hố ga";
    //                             if (groupBySelectBox.option("value") === "HANHCHINH") {
    //                                 data.group_name = "Phường/Xã";
    //                             } else if (groupBySelectBox.option("value") === "MATUYEN") {
    //                                 data.group_name = "Tuyến";
    //                             } else {
    //                                 data.group_name = "Loại hố";
    //                             }
    //                         }
    //                         content = Handlebars.compile(BaoCaoSoLuongTemp)(data);
    //                     }
    //                     break;
    //                 case EnumReportType.ChieuDaiCongThoatNuoc.id:
    //                     data.title = EnumReportType.ChieuDaiCongThoatNuoc.title;
    //                     data.data.forEach(item => {
    //                         item.items.forEach(child => {
    //                             child.stt = ++counter;
    //                         });
    //                     });
    //                     if (groupBySelectBox) {
    //                         const groupBy = groupBySelectBox.option("displayValue");
    //                         if (groupBy) {
    //                             data.title = data.title + " theo " + groupBy.toLowerCase();
    //                             if (groupBySelectBox.option("value") === "HANHCHINH") {
    //                                 data.group_name = "Phường/Xã";
    //                             } else {
    //                                 data.group_name = "Tuyến cáp";
    //                             }
    //                         }
    //                         content = Handlebars.compile(BaoCaoChieuDaiTemp)(data);
    //                     }
    //                     break;
    //                 default:
    //                     break;
    //             }
    //             def.resolve({
    //                 content: content,
    //                 data: data,
    //                 showToolbar: showToolbar,
    //                 totalCount: data.totalCount
    //             });
    //         }
    //         else {
    //             OGUtils.alert(xhr.data["errors"][0].message, "Lỗi");
    //         }
    //         OGUtils.hideLoading();
    //     });
    //     return def.promise();
    // }
    // private getFilterFormItems(type: string, report_id): FormItem[] {
    //     const self = this;
    //     const items = [];
    //     const groupItems = [];
    //     this.formDataFilter = {};
    //     switch (type) {
    //         case "table":
    //             items.push({
    //                 template: () => {
    //                     return "<hr style=\"margin: 5px 0;\" />";
    //                 }
    //             });
    //             switch (report_id) {
    //                 case EnumReportType.SoLuongHoSo.id:
    //                     items.push({
    //                         dataField: "group_by",
    //                         editorOptions: {
    //                             dataSource: [{
    //                                 "id": "TINHTRANG",
    //                                 "text": "Tình trạng",
    //                             }, {
    //                                 "id": "LOAINHA",
    //                                 "text": "Loại nhà",
    //                             }],
    //                             displayExpr: "text",
    //                             valueExpr: "id",
    //                         },
    //                         editorType: "dxSelectBox",
    //                         label: {
    //                             text: "Nhóm theo"
    //                         },
    //                     });
    //                     break;
    //                 case EnumReportType.DuyetHoSoMoiNhat.id:
    //                     items.push({
    //                         dataField: "date",
    //                         editorOptions: {
    //                             applyValueMode: "useButtons",
    //                             endDate: new Date(),
    //                             endDateLabel: "Ngày kết thúc",
    //                             endDateOutOfRangeMessage: "Ngày kết thúc nằm ngoài phạm vi",
    //                             invalidEndDateMessage: "Ngày kết thúc không hợp lệ",
    //                             invalidStartDateMessage: "Ngày bắt đâu không hợp lệ",
    //                             startDate: new Date(),
    //                             startDateLabel: "Ngày bắt đầu",
    //                             startDateOutOfRangeMessage: "Ngày bắt đầu nằm ngoài phạm vi"
    //                         },
    //                         editorType: "dxDateRangeBox",
    //                         label: {
    //                             text: "Ngày"
    //                         },
    //                     });
    //                     break;
    //                 case EnumReportType.ChieuDaiTuyenCap.id:
    //                 case EnumReportType.ChieuDaiCongThoatNuoc.id:
    //                     items.push({
    //                         dataField: "group_by",
    //                         editorOptions: {
    //                             dataSource: [{
    //                                 "id": "HANHCHINH",
    //                                 "text": "Hành chính",
    //                             }, {
    //                                 "id": "MATUYEN",
    //                                 "text": "Tuyến",
    //                             }],
    //                             displayExpr: "text",
    //                             valueExpr: "id",
    //                         },
    //                         editorType: "dxSelectBox",
    //                         label: {
    //                             text: "Nhóm theo"
    //                         },
    //                         validationRules: [{
    //                             message: "Vui lòng chọn tiêu chí nhóm",
    //                             type: "required"
    //                         }]
    //                     });
    //                     items.push({
    //                         dataField: "textSearch",
    //                         editorOptions: {
    //                             dataSource: {
    //                                 pageSize: 25,
    //                                 paginate: true,
    //                                 store: new CustomStore({
    //                                     load: (options) => {
    //                                         return new Promise((resolve) => {
    //                                             // Dropdown tentuyen - tuyenid
    //                                             ReportService.listDistinctValues("tn_tuyen", options.searchValue, (options.skip / options.take) + 1, options.take).then(data => {
    //                                                 resolve({
    //                                                     data: data.data,
    //                                                     totalCount: data.recordsTotal
    //                                                 });
    //                                             });
    //                                         });
    //                                     },
    //                                 })
    //                             },
    //                             deferRendering: true,
    //                             maxDisplayedTags: 1,
    //                             multiline: false,
    //                             noDataText: "Không có dữ liệu",
    //                             onContentReady: () => {
    //                                 $(".dx-list-item-content").each(function () {
    //                                     const $ele = $(this);
    //                                     if (this.offsetWidth < this.scrollWidth) {
    //                                         $ele.attr("title", $ele.text());
    //                                     }
    //                                 });
    //                             },
    //                             searchEnabled: true,
    //                             showClearButton: true,
    //                             showDropDownButton: true,
    //                             showSelectionControls: true,
    //                         },
    //                         editorType: "dxTagBox",
    //                         label: {
    //                             text: "Tên tuyến"
    //                         },
    //                     }, {
    //                         dataField: "districtCode",
    //                         editorOptions: {
    //                             dataSource: new DataSource({
    //                                 key: "area_id",
    //                                 store: new CustomStore({
    //                                     key: "area_id",
    //                                     load: async () => {
    //                                         return await AreaService.districts();
    //                                     },
    //                                     loadMode: "raw"
    //                                 }),
    //                             }),
    //                             displayExpr: "name_vn",
    //                             searchEnabled: true,
    //                             searchExpr: ["name_vn"],
    //                             searchMode: "contains",
    //                             showClearButton: true,
    //                             valueExpr: "area_id",
    //                         },
    //                         editorType: "dxSelectBox",
    //                         label: {
    //                             text: "Quận/Huyện"
    //                         },
    //                     });
    //                     break;
    //                 case EnumReportType.ThongKeSoLuong.id:
    //                     items.push({
    //                         dataField: "layer_id",
    //                         editorOptions: {
    //                             dataSource: {
    //                                 group: "table.table_schema",
    //                                 store: new CustomStore({
    //                                     key: "id",
    //                                     load: (loadOptions) => {
    //                                         const deferred = $.Deferred();
    //                                         $.get("/api/layer/getLayers").done((result) => {
    //                                             if (result.status == "OK") {
    //                                                 const data = result.data;
    //                                                 deferred.resolve(data);
    //                                             } else {
    //                                                 deferred.resolve([]);
    //                                             }
    //                                         });
    //                                         return deferred.promise();
    //                                     },
    //                                     loadMode: "raw",
    //                                 }),
    //                             },
    //                             deferRendering: true,
    //                             displayExpr: "name_vn",
    //                             grouped: true,
    //                             height: 32,
    //                             maxDisplayedTags: 1,
    //                             multiline: false,
    //                             noDataText: "Không có dữ liệu",
    //                             onContentReady: () => {
    //                                 $(".dx-list-item-content").each(function () {
    //                                     const $ele = $(this);
    //                                     if (this.offsetWidth < this.scrollWidth) {
    //                                         $ele.attr("title", $ele.text());
    //                                     }
    //                                 });
    //                             },
    //                             onSelectionChanged: (e) => {
    //                                 const selectedItems = e.component.option("selectedItems");
    //                                 if (selectedItems) {
    //                                     const groupBySelectBox = this.filterForm.getEditor("group_by") as dxSelectBox;
    //                                     if (groupBySelectBox) {
    //                                         if (selectedItems.length === 1) {
    //                                             groupBySelectBox.option("disabled", false);
    //                                         } else {
    //                                             groupBySelectBox.option("disabled", true);
    //                                         }
    //                                         groupBySelectBox.getDataSource().reload();
    //                                         groupBySelectBox.reset();
    //                                     }
    //                                 }
    //                             },
    //                             searchEnabled: true,
    //                             searchExpr: ["name_vn"],
    //                             searchMode: "contains",
    //                             showClearButton: true,
    //                             showDropDownButton: true,
    //                             showSelectionControls: true,
    //                             valueExpr: "id",
    //                         },
    //                         editorType: "dxTagBox",
    //                         label: {
    //                             text: "Lớp dữ liệu"
    //                         },
    //                         validationRules: [{
    //                             message: "Vui lòng chọn ít nhất 1 lớp dữ liệu",
    //                             type: "required"
    //                         }]
    //                     }, {
    //                         dataField: "group_by",
    //                         editorOptions: {
    //                             dataSource: new DataSource({
    //                                 store: new CustomStore({
    //                                     key: "column_name",
    //                                     load: (loadOptions) => {
    //                                         const deferred = $.Deferred();
    //                                         const layerTagBox = this.filterForm.getEditor("layer_id") as dxTagBox;
    //                                         const layerSelected = layerTagBox.option("selectedItems");
    //                                         if (layerSelected && layerSelected.length) {
    //                                             TableColumnService.list(layerSelected[0].table.id, true).then(result => {
    //                                                 if (result && result.status == EnumStatus.OK) {
    //                                                     deferred.resolve(result.data);
    //                                                 } else {
    //                                                     deferred.resolve([]);
    //                                                 }
    //                                             });
    //                                         } else {
    //                                             deferred.resolve([]);
    //                                         }
    //                                         return deferred.promise();
    //                                     },
    //                                     loadMode: "raw"
    //                                 }),
    //                             }),
    //                             disabled: true,
    //                             displayExpr: "name_vn",
    //                             searchEnabled: true,
    //                             searchExpr: ["name_vn"],
    //                             searchMode: "contains",
    //                             valueExpr: "column_name"
    //                         },
    //                         editorType: "dxSelectBox",
    //                         label: {
    //                             text: "Nhóm theo"
    //                         },
    //                     });
    //                     items.push({
    //                         dataField: "textSearch",
    //                         editorOptions: {

    //                         },
    //                         editorType: "dxTextBox",
    //                         label: {
    //                             text: "Tuyến"
    //                         },
    //                     }, {
    //                         dataField: "districtCode",
    //                         editorOptions: {
    //                             dataSource: new DataSource({
    //                                 key: "area_id",
    //                                 store: new CustomStore({
    //                                     key: "area_id",
    //                                     load: async () => {
    //                                         return await AreaService.districts();
    //                                     },
    //                                     loadMode: "raw"
    //                                 }),
    //                             }),
    //                             displayExpr: "name_vn",
    //                             searchEnabled: true,
    //                             searchExpr: ["name_vn"],
    //                             searchMode: "contains",
    //                             showClearButton: true,
    //                             valueExpr: "area_id",
    //                         },
    //                         editorType: "dxSelectBox",
    //                         label: {
    //                             text: "Quận/Huyện"
    //                         },
    //                     });
    //                     break;
    //                 case EnumReportType.TongHopThoatNuoc.id:
    //                     items.push({
    //                         dataField: "districtCode",
    //                         editorOptions: {
    //                             dataSource: new DataSource({
    //                                 key: "area_id",
    //                                 store: new CustomStore({
    //                                     key: "area_id",
    //                                     load: async () => {
    //                                         return await AreaService.districts();
    //                                     },
    //                                     loadMode: "raw"
    //                                 }),
    //                             }),
    //                             displayExpr: "name_vn",
    //                             searchEnabled: true,
    //                             searchExpr: ["name_vn"],
    //                             searchMode: "contains",
    //                             showClearButton: true,
    //                             valueExpr: "area_id",
    //                         },
    //                         editorType: "dxSelectBox",
    //                         label: {
    //                             text: "Quận/Huyện"
    //                         },
    //                     });
    //                     break;
    //                 case EnumReportType.ThongKeCayXanhTheoTuyen.id:
    //                     items.push({
    //                         dataField: "textSearch",
    //                         editorOptions: {
    //                             dataSource: {
    //                                 pageSize: 25,
    //                                 paginate: true,
    //                                 store: new CustomStore({
    //                                     load: (options) => {
    //                                         return new Promise((resolve) => {
    //                                             // Dropdown tentuyen - tuyenid
    //                                             ReportService.listDistinctValues("cx_tuyen", options.searchValue, (options.skip / options.take) + 1, options.take).then(data => {
    //                                                 resolve({
    //                                                     data: data.data,
    //                                                     totalCount: data.recordsTotal
    //                                                 });
    //                                             });
    //                                         });
    //                                     },
    //                                 })
    //                             },
    //                             deferRendering: true,
    //                             maxDisplayedTags: 1,
    //                             multiline: false,
    //                             noDataText: "Không có dữ liệu",
    //                             onContentReady: () => {
    //                                 $(".dx-list-item-content").each(function () {
    //                                     const $ele = $(this);
    //                                     if (this.offsetWidth < this.scrollWidth) {
    //                                         $ele.attr("title", $ele.text());
    //                                     }
    //                                 });
    //                             },
    //                             searchEnabled: true,
    //                             showClearButton: true,
    //                             showDropDownButton: true,
    //                             showSelectionControls: true,
    //                         },
    //                         editorType: "dxTagBox",
    //                         label: {
    //                             text: "Tên tuyến"
    //                         },
    //                         validationRules: [{
    //                             message: "Vui lòng nhập ít nhất một tuyến thống kê",
    //                             type: "required"
    //                         }],
    //                     }, {
    //                         dataField: "districtCode",
    //                         editorOptions: {
    //                             dataSource: new DataSource({
    //                                 key: "area_id",
    //                                 store: new CustomStore({
    //                                     key: "area_id",
    //                                     load: async () => {
    //                                         return await AreaService.districts();
    //                                     },
    //                                     loadMode: "raw"
    //                                 }),
    //                             }),
    //                             displayExpr: "name_vn",
    //                             searchEnabled: true,
    //                             searchExpr: ["name_vn"],
    //                             searchMode: "contains",
    //                             showClearButton: true,
    //                             valueExpr: "area_id",
    //                         },
    //                         editorType: "dxSelectBox",
    //                         label: {
    //                             text: "Quận/Huyện"
    //                         },
    //                     });
    //                     break;
    //                 case EnumReportType.ThongKeChieuSangTheoTuyen.id:
    //                     items.push({
    //                         dataField: "textSearch",
    //                         editorOptions: {
    //                             dataSource: {
    //                                 pageSize: 25,
    //                                 paginate: true,
    //                                 store: new CustomStore({
    //                                     load: (options) => {
    //                                         return new Promise((resolve) => {
    //                                             // Dropdown tentuyen - tuyenid
    //                                             ReportService.listDistinctValues("cs_tuyen", options.searchValue, (options.skip / options.take) + 1, options.take).then(data => {
    //                                                 resolve({
    //                                                     data: data.data,
    //                                                     totalCount: data.recordsTotal
    //                                                 });
    //                                             });
    //                                         });
    //                                     },
    //                                 })
    //                             },
    //                             deferRendering: true,
    //                             maxDisplayedTags: 1,
    //                             multiline: false,
    //                             noDataText: "Không có dữ liệu",
    //                             onContentReady: () => {
    //                                 $(".dx-list-item-content").each(function () {
    //                                     const $ele = $(this);
    //                                     if (this.offsetWidth < this.scrollWidth) {
    //                                         $ele.attr("title", $ele.text());
    //                                     }
    //                                 });
    //                             },
    //                             searchEnabled: true,
    //                             showClearButton: true,
    //                             showDropDownButton: true,
    //                             showSelectionControls: true,
    //                         },
    //                         editorType: "dxTagBox",
    //                         label: {
    //                             text: "Tên tuyến"
    //                         },

    //                     }, {
    //                         dataField: "districtCode",
    //                         editorOptions: {
    //                             dataSource: new DataSource({
    //                                 key: "area_id",
    //                                 store: new CustomStore({
    //                                     key: "area_id",
    //                                     load: async () => {
    //                                         return await AreaService.districts();
    //                                     },
    //                                     loadMode: "raw"
    //                                 }),
    //                             }),
    //                             displayExpr: "name_vn",
    //                             searchEnabled: true,
    //                             searchExpr: ["name_vn"],
    //                             searchMode: "contains",
    //                             showClearButton: true,
    //                             valueExpr: "area_id",
    //                         },
    //                         editorType: "dxSelectBox",
    //                         label: {
    //                             text: "Quận/Huyện"
    //                         },
    //                     });
    //                     break;
    //                 case EnumReportType.ThongKeChieuSangTheoTramDen.id:
    //                     items.push({
    //                         dataField: "textSearch",
    //                         editorOptions: {
    //                             dataSource: {
    //                                 pageSize: 25,
    //                                 paginate: true,
    //                                 store: new CustomStore({
    //                                     load: (options) => {
    //                                         return new Promise((resolve) => {
    //                                             ReportService.listDistinctValues("cs_tramden", options.searchValue, (options.skip / options.take) + 1, options.take).then(data => {
    //                                                 resolve({
    //                                                     data: data.data,
    //                                                     totalCount: data.recordsTotal
    //                                                 });
    //                                             });
    //                                         });
    //                                     },
    //                                 })
    //                             },
    //                             deferRendering: true,
    //                             maxDisplayedTags: 1,
    //                             multiline: false,
    //                             noDataText: "Không có dữ liệu",
    //                             onContentReady: () => {
    //                                 $(".dx-list-item-content").each(function () {
    //                                     const $ele = $(this);
    //                                     if (this.offsetWidth < this.scrollWidth) {
    //                                         $ele.attr("title", $ele.text());
    //                                     }
    //                                 });
    //                             },
    //                             searchEnabled: true,
    //                             showClearButton: true,
    //                             showDropDownButton: true,
    //                             showSelectionControls: true,
    //                         },
    //                         editorType: "dxTagBox",
    //                         label: {
    //                             text: "Tên trạm đèn"
    //                         },

    //                     }, {
    //                         dataField: "districtCode",
    //                         editorOptions: {
    //                             dataSource: new DataSource({
    //                                 key: "area_id",
    //                                 store: new CustomStore({
    //                                     key: "area_id",
    //                                     load: async () => {
    //                                         return await AreaService.districts();
    //                                     },
    //                                     loadMode: "raw"
    //                                 }),
    //                             }),
    //                             displayExpr: "name_vn",
    //                             searchEnabled: true,
    //                             searchExpr: ["name_vn"],
    //                             searchMode: "contains",
    //                             showClearButton: true,
    //                             valueExpr: "area_id",
    //                         },
    //                         editorType: "dxSelectBox",
    //                         label: {
    //                             text: "Quận/Huyện"
    //                         },
    //                     });
    //                     break;
    //                 case EnumReportType.ThongKeThoatNuocTheoTuyen.id:
    //                     items.push({
    //                         dataField: "textSearch",
    //                         editorOptions: {
    //                             dataSource: {
    //                                 pageSize: 25,
    //                                 paginate: true,
    //                                 store: new CustomStore({
    //                                     load: (options) => {
    //                                         return new Promise((resolve) => {
    //                                             // Dropdown tenho - lớp tn_hodieuhoa
    //                                             ReportService.listDistinctValues("tn_hodieuhoa", options.searchValue, (options.skip / options.take) + 1, options.take).then(data => {
    //                                                 resolve({
    //                                                     data: data.data,
    //                                                     totalCount: data.recordsTotal
    //                                                 });
    //                                             });
    //                                         });
    //                                     },
    //                                 })
    //                             },
    //                             searchEnabled: true,
    //                             showClearButton: true
    //                         },
    //                         editorType: "dxSelectBox",
    //                         // editorType: "dxTextBox",
    //                         label: {
    //                             text: "Tên hồ"
    //                         },
    //                     }, {
    //                         dataField: "districtCode",
    //                         editorOptions: {
    //                             dataSource: new DataSource({
    //                                 key: "area_id",
    //                                 store: new CustomStore({
    //                                     key: "area_id",
    //                                     load: async () => {
    //                                         return await AreaService.districts();
    //                                     },
    //                                     loadMode: "raw"
    //                                 }),
    //                             }),
    //                             displayExpr: "name_vn",
    //                             searchEnabled: true,
    //                             searchExpr: ["name_vn"],
    //                             searchMode: "contains",
    //                             showClearButton: true,
    //                             valueExpr: "area_id",
    //                         },
    //                         editorType: "dxSelectBox",
    //                         label: {
    //                             text: "Quận/Huyện"
    //                         },
    //                     });
    //                     break;
    //                 case EnumReportType.ThongKeThoatNuocTheoHo.id:
    //                     items.push({
    //                         dataField: "textSearch",
    //                         editorOptions: {
    //                             dataSource: {
    //                                 pageSize: 25,
    //                                 paginate: true,
    //                                 store: new CustomStore({
    //                                     load: (options) => {
    //                                         return new Promise((resolve) => {
    //                                             // Dropdown tenho - lớp tn_hodieuhoa
    //                                             ReportService.listDistinctValues("tn_hodieuhoa", options.searchValue, (options.skip / options.take) + 1, options.take).then(data => {
    //                                                 resolve({
    //                                                     data: data.data,
    //                                                     totalCount: data.recordsTotal
    //                                                 });
    //                                             });
    //                                         });
    //                                     },
    //                                 })
    //                             },
    //                             searchEnabled: true,
    //                             showClearButton: true
    //                         },
    //                         editorType: "dxSelectBox",
    //                         label: {
    //                             text: "Tên hồ"
    //                         },
    //                     }, {
    //                         dataField: "districtCode",
    //                         editorOptions: {
    //                             dataSource: new DataSource({
    //                                 key: "area_id",
    //                                 store: new CustomStore({
    //                                     key: "area_id",
    //                                     load: async () => {
    //                                         return await AreaService.districts();
    //                                     },
    //                                     loadMode: "raw"
    //                                 }),
    //                             }),
    //                             displayExpr: "name_vn",
    //                             searchEnabled: true,
    //                             searchExpr: ["name_vn"],
    //                             searchMode: "contains",
    //                             showClearButton: true,
    //                             valueExpr: "area_id",
    //                         },
    //                         editorType: "dxSelectBox",
    //                         label: {
    //                             text: "Quận/Huyện"
    //                         },
    //                     });
    //                     break;
    //                 case EnumReportType.ThongKePhanLoaiCongThoatNuoc.id:
    //                     items.push({
    //                         dataField: "textSearch",
    //                         editorOptions: {
    //                             dataSource: {
    //                                 pageSize: 25,
    //                                 paginate: true,
    //                                 store: new CustomStore({
    //                                     load: (options) => {
    //                                         return new Promise((resolve) => {
    //                                             // Dropdown tenho - lớp tn_hodieuhoa
    //                                             ReportService.listDistinctValues("tn_hodieuhoa", options.searchValue, (options.skip / options.take) + 1, options.take).then(data => {
    //                                                 resolve({
    //                                                     data: data.data,
    //                                                     totalCount: data.recordsTotal
    //                                                 });
    //                                             });
    //                                         });
    //                                     },
    //                                 })
    //                             },
    //                             searchEnabled: true,
    //                             showClearButton: true
    //                         },
    //                         editorType: "dxSelectBox",
    //                         label: {
    //                             text: "Tên hồ"
    //                         },
    //                     }, {
    //                         dataField: "districtCode",
    //                         editorOptions: {
    //                             dataSource: new DataSource({
    //                                 key: "area_id",
    //                                 store: new CustomStore({
    //                                     key: "area_id",
    //                                     load: async () => {
    //                                         return await AreaService.districts();
    //                                     },
    //                                     loadMode: "raw"
    //                                 }),
    //                             }),
    //                             displayExpr: "name_vn",
    //                             searchEnabled: true,
    //                             searchExpr: ["name_vn"],
    //                             searchMode: "contains",
    //                             showClearButton: true,
    //                             valueExpr: "area_id",
    //                         },
    //                         editorType: "dxSelectBox",
    //                         label: {
    //                             text: "Quận/Huyện"
    //                         },
    //                     });
    //                     break;
    //                 case EnumReportType.SoLuongCayXanh.id:
    //                     items.push({
    //                         dataField: "group_by",
    //                         editorOptions: {
    //                             dataSource: [{
    //                                 "id": "HANHCHINH",
    //                                 "text": "Hành chính",
    //                             }, {
    //                                 "id": "MATUYEN",
    //                                 "text": "Mã tuyến",
    //                             }, {
    //                                 "id": "LOAICAY",
    //                                 "text": "Loại cây",
    //                             }],
    //                             displayExpr: "text",
    //                             valueExpr: "id",
    //                         },
    //                         editorType: "dxSelectBox",
    //                         label: {
    //                             text: "Nhóm theo"
    //                         },
    //                     });
    //                     items.push({
    //                         dataField: "districtCode",
    //                         editorOptions: {
    //                             dataSource: new DataSource({
    //                                 key: "area_id",
    //                                 store: new CustomStore({
    //                                     key: "area_id",
    //                                     load: async () => {
    //                                         return await AreaService.districts();
    //                                     },
    //                                     loadMode: "raw"
    //                                 }),
    //                             }),
    //                             displayExpr: "name_vn",
    //                             searchEnabled: true,
    //                             searchExpr: ["name_vn"],
    //                             searchMode: "contains",
    //                             showClearButton: true,
    //                             valueExpr: "area_id",
    //                         },
    //                         editorType: "dxSelectBox",
    //                         label: {
    //                             text: "Quận/Huyện"
    //                         },
    //                     });
    //                     break;
    //                 case EnumReportType.SoLuongHoGa.id:
    //                 case EnumReportType.SoLuongCongThoatNuoc.id:
    //                     items.push({
    //                         dataField: "group_by",
    //                         editorOptions: {
    //                             dataSource: [{
    //                                 "id": "HANHCHINH",
    //                                 "text": "Hành chính",
    //                             }, {
    //                                 "id": "MATUYEN",
    //                                 "text": "Mã tuyến",
    //                             }],
    //                             displayExpr: "text",
    //                             valueExpr: "id",
    //                         },
    //                         editorType: "dxSelectBox",
    //                         label: {
    //                             text: "Nhóm theo"
    //                         },
    //                     });
    //                     items.push({
    //                         dataField: "districtCode",
    //                         editorOptions: {
    //                             dataSource: new DataSource({
    //                                 key: "area_id",
    //                                 store: new CustomStore({
    //                                     key: "area_id",
    //                                     load: async () => {
    //                                         return await AreaService.districts();
    //                                     },
    //                                     loadMode: "raw"
    //                                 }),
    //                             }),
    //                             displayExpr: "name_vn",
    //                             searchEnabled: true,
    //                             searchExpr: ["name_vn"],
    //                             searchMode: "contains",
    //                             showClearButton: true,
    //                             valueExpr: "area_id"
    //                         },
    //                         editorType: "dxSelectBox",
    //                         label: {
    //                             text: "Quận/Huyện"
    //                         },
    //                     });
    //                     break;
    //                 default:
    //                     break;
    //             }
    //             items.push({
    //                 colSpan: 3,
    //                 template: (itemData, itemElement) => {
    //                     this.reportToolbarBieuMau = $("<div  />").appendTo(itemElement)
    //                         .dxToolbar({
    //                             items: [{
    //                                 location: "center",
    //                                 options: {
    //                                     icon: "icon icon-login",
    //                                     onClick: () => {
    //                                         const validate = self.filterForm.validate();
    //                                         if (validate && validate.brokenRules.length === 0) {
    //                                             this.pageIndex = 1;
    //                                             this.pageSize = 25;
    //                                             this.reportTableToolbar.resetOption("items[0].options.totalCount");
    //                                             this.getReport();
    //                                         }
    //                                     },
    //                                     stylingMode: "contained",
    //                                     text: "Xuất báo cáo",
    //                                     type: "default"
    //                                 },
    //                                 widget: "dxButton"
    //                             }, {
    //                                 location: "center",
    //                                 options: {
    //                                     icon: "icon icon-receive-square",
    //                                     onClick: () => {
    //                                         this.exportReportToExcel();
    //                                     },
    //                                     stylingMode: "contained",
    //                                     text: "Xuất Excel",
    //                                     type: "danger"
    //                                 },
    //                                 widget: "dxButton"
    //                             },]
    //                         }).css("padding", "10px").dxToolbar("instance");
    //                 }
    //             });
    //             return items;
    //         case "chart":
    //             items.push({
    //                 template: () => {
    //                     return "<hr style=\"margin: 5px 0;\" />";
    //                 }
    //             });
    //             switch (report_id) {
    //                 case EnumChartType.SoLuong.id:
    //                     break;
    //                 case EnumChartType.SoLuongSuCo.id:
    //                 case EnumChartType.SoLuongBaoTriBaoDuong.id:
    //                     items.push({
    //                         dataField: "group_by",
    //                         editorOptions: {
    //                             dataSource: [{
    //                                 "id": "DIABAN",
    //                                 "text": "Địa bàn",
    //                             }, {
    //                                 "id": "LOAICONGTRINH",
    //                                 "text": "Loại công trình",
    //                             }],
    //                             displayExpr: "text",
    //                             valueExpr: "id",
    //                         },
    //                         editorType: "dxSelectBox",
    //                         label: {
    //                             text: "Nhóm theo"
    //                         },
    //                     });
    //                     break;
    //                 case EnumChartType.SoLuongHoSo.id:
    //                     items.push({
    //                         dataField: "group_by",
    //                         editorOptions: {
    //                             dataSource: [{
    //                                 "id": "TINHTRANG",
    //                                 "text": "Tình trạng",
    //                             }, {
    //                                 "id": "LOAINHA",
    //                                 "text": "Loại nhà",
    //                             }],
    //                             displayExpr: "text",
    //                             valueExpr: "id",
    //                         },
    //                         editorType: "dxSelectBox",
    //                         label: {
    //                             text: "Nhóm theo"
    //                         },
    //                     });
    //                     break;
    //                 default:
    //                     break;
    //             }
    //             items.push({
    //                 dataField: "chart_type",
    //                 editorOptions: {
    //                     dataSource: [{
    //                         id: "bar-chart",
    //                         name: "Biểu đồ cột"
    //                     }, {
    //                         id: "pie-chart",
    //                         name: "Biểu đồ tròn"
    //                     }],
    //                     displayExpr: "name",
    //                     placeholder: "[Chọn ...]",
    //                     showClearButton: true,
    //                     valueExpr: "id",
    //                 },
    //                 editorType: "dxSelectBox",
    //                 label: {
    //                     text: "Loại biểu đồ"
    //                 },
    //             }, {
    //                 template: (itemData, itemElement) => {
    //                     $("<div />").appendTo(itemElement)
    //                         .dxToolbar({
    //                             items: [{
    //                                 location: "center",
    //                                 options: {
    //                                     icon: "icon icon-login",
    //                                     onClick: () => {
    //                                         this.getCustomChartData().then(result => {
    //                                             let title = this.selectedReportType.text;
    //                                             const groupBySelectBox = this.filterForm.getEditor("group_by") as dxSelectBox;
    //                                             if (groupBySelectBox) {
    //                                                 const groupBy = groupBySelectBox.option("displayValue");
    //                                                 if (groupBy) {
    //                                                     title = title + " theo " + groupBy.toLowerCase();
    //                                                 }
    //                                             }
    //                                             this.getChartReport({
    //                                                 chart_type: this.filterForm.option("formData").chart_type,
    //                                                 data: result,
    //                                                 title: title
    //                                             });
    //                                         });
    //                                     },
    //                                     stylingMode: "contained",
    //                                     text: "Xuất biểu đồ",
    //                                     type: "default"
    //                                 },
    //                                 widget: "dxButton"
    //                             },]
    //                         }).css("padding", "10px").dxToolbar("instance");
    //                 }
    //             });
    //             return items;
    //         default:
    //             return [];
    //     }
    // }

    // private getReport(): void {
    //     const self = this;
    //     const idReport = this.reportOptionsTreeView.option("selectedItem").id;
    //     const pageSize = this.pageSize, pageIndex = this.pageIndex;
    //     //
    //     this.reportView.option("selectedIndex", 0);
    //     const dateEditor = this.filterForm.getEditor("date");
    //     let dateStart, dateEnd;
    //     if (dateEditor) {
    //         dateStart = dateEditor.option("startDate") ? moment(dateEditor.option("startDate")).format("YYYY-MM-DD") : null;
    //         dateEnd = dateEditor.option("endDate") ? moment(dateEditor.option("endDate")).format("YYYY-MM-DD") : null;
    //     }
    //     const layerIds = this.filterForm.option("formData").layer_id;
    //     const groupBy = this.filterForm.option("formData").group_by;
    //     let textSearch = "";
    //     const textSearchEditor = this.filterForm.getEditor("textSearch");
    //     if (textSearchEditor) {
    //         if (textSearchEditor instanceof dxTagBox) {
    //             textSearch = this.filterForm.option("formData").textSearch?.toString();
    //         } else if (textSearchEditor instanceof dxSelectBox) {
    //             textSearch = this.filterForm.option("formData").textSearch;
    //         }
    //     }

    //     if (layerIds && (layerIds.length == 1) && !groupBy) {
    //         OGUtils.alert("Vui lòng chọn kiểu nhóm thống kê dữ liệu!");
    //     } else {
    //         const param = {
    //             communeCode: this.filterForm.option("formData").communeCode,
    //             dateEnd: dateEnd,
    //             dateStart: dateStart,
    //             districtCode: this.filterForm.option("formData").districtCode,
    //             groupBy: this.filterForm.option("formData").group_by,
    //             layerIds: this.filterForm.option("formData").layer_id,
    //             pageIndex: pageIndex,
    //             pageSize: pageSize,
    //             reportType: idReport,
    //             textSearch: textSearch,
    //         };
    //         OGUtils.showLoading();
    //         self.getData(param).then(res => {
    //             OGUtils.hideLoading();
    //             if (res) {
    //                 this.loadReport(res);
    //             }
    //         });
    //     }
    // }

    private initLayout(): void {
        const self = this;
        this.mainAccordionContainer = $("<div class=\"shown\" />").appendTo(this.container).height("100%").css("width", "360px").css("float", "left");
        this.reportContainer = $("<div />").appendTo(this.container).height(window.innerHeight - $("#header").outerHeight() - 15)
            .css("margin-left", "360px").css("border-left", "1px solid #ddd");

        this.initReportOptionsTree();
        this.initReportView();
    }

    private initReportOptionsTree(): void {
        const self = this;
        this.reportOptionsTreeView = $("<div style='padding:5px;'/>").appendTo(this.mainAccordionContainer).dxTreeView({
            dataSource: new DataSource({
                key: "id",
                store: new CustomStore({
                    key: "id",
                    load: () => {
                        return new Promise((resolve) => {
                            $.get("/api/bao-cao/tree", { mapId: this.mapId }).done((result) => {
                                if (result.status === EnumStatus.OK) {
                                    resolve({
                                        data: result.data,
                                        totalCount: result.data.length
                                    });
                                } else {
                                    resolve({
                                        data: [],
                                        totalCount: 0
                                    });
                                }
                            });
                        });
                    }
                })
            }),
            displayExpr: "text",
            // focusStateEnabled: true,
            height: "90%",
            // itemTemplate: function (data, index, element) {
            //     element.html(`<b>${data.text}</b>`);
            // },
            keyExpr: "id",
            onItemClick: function (e) {
                $(".dx-treeview-item").removeClass("currently-active-item");
                $(e.itemElement).addClass("currently-active-item");
                e.component.option("selectedItem", e.itemData);
                if (e.itemData.raw) {
                    let pageSizes = [25, 50, 100];

                    if (e.itemData.raw.page_sizes) {
                        pageSizes = e.itemData.raw.page_sizes.split(",").map(x => parseInt(x));
                    }
                    self.pageSize = pageSizes[0];
                    self.reportTableToolbar.option("items[0].options.pageSizes", pageSizes);
                    self.reportTableToolbar.option("items[0].options.pageSize", self.pageSize);

                    $.get("/api/bao-cao/" + e.itemData.raw.id).then(xhr => {
                        if (xhr.status === EnumStatus.OK) {
                            self.selectedReportType = xhr.data;
                            const items = [];
                            let item = {};
                            if (self.selectedReportType && self.selectedReportType.filterFields.length) {
                                self.selectedReportType.filterFields.forEach(field => {
                                    if (field.column_name === "district_code") {
                                        // item = {
                                        //     dataField: field.column_name,
                                        //     editorOptions: {
                                        //         dataSource: new DataSource({
                                        //             key: "area_id",
                                        //             store: new CustomStore({
                                        //                 key: "area_id",
                                        //                 load: async () => {
                                        //                     return await AreaService.districts();
                                        //                 },
                                        //                 loadMode: "raw"
                                        //             }),
                                        //         }),
                                        //         displayExpr: "name_vn",
                                        //         searchEnabled: true,
                                        //         searchExpr: ["name_vn"],
                                        //         searchMode: "contains",
                                        //         showClearButton: true,
                                        //         valueExpr: "area_id",
                                        //     },
                                        //     editorType: "dxSelectBox",
                                        //     label: {
                                        //         text: field.name_vn
                                        //     },
                                        // };
                                        item = {
                                            dataField: field.column_name,
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
                                                maxDisplayedTags: 1,
                                                noDataText: "Không có dữ liệu",
                                                onContentReady: () => {
                                                    $(".dx-list-item-content").each(function () {
                                                        const $ele = $(this);
                                                        $ele.attr("title", $ele.text());
                                                    });
                                                },
                                                onMultiTagPreparing: function (args) {
                                                    const selectedItemsLength = args.selectedItems.length,
                                                        totalCount = 1;

                                                    if (selectedItemsLength < totalCount) {
                                                        args.cancel = true;
                                                    } else {
                                                        args.text = "[" + selectedItemsLength + "] lựa chọn";
                                                    }
                                                },
                                                placeholder: "[Chọn...]",
                                                searchEnabled: true,
                                                searchExpr: ["name_vn"],
                                                searchMode: "contains",
                                                showClearButton: true,
                                                showDropDownButton: true,
                                                showSelectionControls: true,
                                                valueExpr: "area_id",
                                            },
                                            editorType: "dxTagBox",
                                            label: {
                                                text: field.name_vn
                                            },
                                        };
                                    }
                                    else if (field.column_name === "user_id") {
                                        item = {
                                            dataField: field.column_name,
                                            editorOptions: {
                                                dataSource: new DataSource({
                                                    key: "id",
                                                    store: new CustomStore({
                                                        key: "user_id",
                                                        load: async (options) => {
                                                            const deferred = $.Deferred();
                                                            //
                                                            $.ajax({
                                                                data: { q: options.searchValue, skip: options.skip, take: options.take },
                                                                error: () => {
                                                                    deferred.reject("Data Loading Error");
                                                                },
                                                                success: (xhr) => {
                                                                    if (xhr && xhr.status === EnumStatus.OK) {
                                                                        deferred.resolve(xhr.data);
                                                                    } else {
                                                                        deferred.resolve([]);
                                                                    }
                                                                },
                                                                type: "get",
                                                                url: "/api/user/list-user-infos",
                                                            });
                                                            return deferred.promise();
                                                        },
                                                        loadMode: "raw"
                                                    }),
                                                }),
                                                displayExpr: "full_name",
                                                searchEnabled: true,
                                                searchExpr: ["full_name"],
                                                searchMode: "contains",
                                                showClearButton: true,
                                                valueExpr: "user_id",
                                            },
                                            editorType: "dxSelectBox",
                                            label: {
                                                text: field.name_vn
                                            },

                                        };
                                    }
                                    else if (field.column_name === "from" || field.column_name === "to") {
                                        item = {
                                            dataField: field.column_name,
                                            editorOptions: {
                                                applyButtonText: "Xác nhận",
                                                cancelButtonText: "Hủy",
                                                displayFormat: "dd/MM/yyyy",
                                                invalidDateMessage: "Vui lòng nhập đúng định dạng: " + "dd/MM/yyyy",
                                                placeholder: field.name_vn,
                                                showAnalogClock: false,
                                                showClearButton: true,
                                                type: "date",
                                                width: "100%",
                                            },
                                            editorType: "dxDateBox",
                                            label: {
                                                text: field.name_vn,
                                            },

                                        };
                                    }
                                    else if (field.table) {
                                        item = {

                                            // dataField: field.column_name,
                                            // editorOptions: {
                                            //     dataSource: {
                                            //         key: "id",
                                            //         pageSize: 50,
                                            //         paginate: true,
                                            //         store: new CustomStore({
                                            //             byKey: (key) => {
                                            //                 return new Promise<ResolvedData>((resolve) => {
                                            //                     $.get(`/api/table/short-data/${field.table.id}/${key}`).done(xhr => {
                                            //                         if (xhr.status === EnumStatus.OK) {
                                            //                             resolve(xhr.data);
                                            //                         }
                                            //                         else {
                                            //                             resolve({});
                                            //                         }
                                            //                     });
                                            //                 });
                                            //             },
                                            //             load: (loadOptions) => {
                                            //                 return TableService.shortData({
                                            //                     district_code: self.filterForm.option("formData")?.district_code ?? "",
                                            //                     q: loadOptions.searchValue,
                                            //                     skip: loadOptions.skip ?? 0,
                                            //                     table_id: field.table.id,
                                            //                     take: loadOptions.take ?? 50
                                            //                 });
                                            //             },
                                            //             // loadMode: "raw"
                                            //         })
                                            //     },
                                            //     displayExpr: "mo_ta",
                                            //     maxDisplayedTags: 1,
                                            //     noDataText: "Không có dữ liệu",
                                            //     onContentReady: () => {
                                            //         $(".dx-list-item-content").each(function () {
                                            //             const $ele = $(this);
                                            //             $ele.attr("title", $ele.text());
                                            //         });
                                            //     },
                                            //     onMultiTagPreparing: function (args) {
                                            //         const selectedItemsLength = args.selectedItems.length,
                                            //             totalCount = 1;

                                            //         if (selectedItemsLength < totalCount) {
                                            //             args.cancel = true;
                                            //         } else {
                                            //             args.text = "[" + selectedItemsLength + "] lựa chọn";
                                            //         }
                                            //     },
                                            //     onOpened: function (e) {
                                            //         e.component.reset();
                                            //         e.component.getDataSource().reload();
                                            //     },
                                            //     placeholder: "[Chọn...]",
                                            //     searchEnabled: true,
                                            //     searchExpr: ["mo_ta"],
                                            //     searchMode: "contains",
                                            //     showClearButton: true,
                                            //     showDropDownButton: true,
                                            //     showSelectionControls: true,
                                            //     valueExpr: "id",
                                            // },
                                            // editorType: "dxTagBox",
                                            // label: {
                                            //     text: field.name_vn
                                            // },
                                            dataField: field.column_name,
                                            editorOptions: {
                                                dataSource: new DataSource({
                                                    key: "id",
                                                    store: new CustomStore({
                                                        byKey: (key) => {
                                                            return new Promise<ResolvedData>((resolve) => {
                                                                $.get(`/api/table/short-data/${field.table.id}/${key}`).done(xhr => {
                                                                    if (xhr.status === EnumStatus.OK) {
                                                                        resolve(xhr.data);
                                                                    }
                                                                    else {
                                                                        resolve({});
                                                                    }
                                                                });
                                                            });
                                                        },
                                                        key: "id",
                                                        load: (loadOptions) => {
                                                            return TableService.shortData({
                                                                district_codes: self.filterForm.option("formData")?.district_code ?? "",
                                                                q: loadOptions.searchValue,
                                                                skip: loadOptions.skip ?? 0,
                                                                table_id: field.table.id,
                                                                take: loadOptions.take ?? 50
                                                            });
                                                        },
                                                        // loadMode: "raw"
                                                    }),
                                                }),
                                                displayExpr: "mo_ta",
                                                itemTemplate: function (itemData, itemIndex, itemElement) {
                                                    return itemData.id + "-" + itemData.mo_ta;
                                                },
                                                maxDisplayedTags: 1,
                                                noDataText: "Không có dữ liệu",
                                                // onContentReady: () => {
                                                //     $(".dx-list-item-content").each(function () {
                                                //         const $ele = $(this);
                                                //         $ele.attr("title", $ele.text());
                                                //     });
                                                // },
                                                onMultiTagPreparing: function (args) {
                                                    const selectedItemsLength = args.selectedItems.length,
                                                        totalCount = 1;

                                                    if (selectedItemsLength < totalCount) {
                                                        args.cancel = true;
                                                    } else {
                                                        args.text = "[" + selectedItemsLength + "] lựa chọn";
                                                    }
                                                },
                                                onOpened: function (e) {
                                                    e.component.reset();
                                                    e.component.getDataSource().reload();
                                                },
                                                placeholder: "[Chọn...]",
                                                searchEnabled: true,
                                                searchExpr: ["mo_ta"],
                                                searchMode: "contains",
                                                showClearButton: true,
                                                showDropDownButton: true,
                                                showSelectionControls: true,
                                                valueExpr: "id",
                                            },
                                            editorType: "dxTagBox",
                                            label: {
                                                text: field.name_vn
                                            },
                                        };
                                    }
                                    else {
                                        item = {
                                            dataField: field.column_name,
                                            editorOptions: {
                                                acceptCustomValue: true,
                                                dataSource: new DataSource({
                                                    store: new CustomStore({
                                                        load: async (options) => {
                                                            return new Promise((resolve) => {
                                                                TableColumnService.dataByName(field.table_name, field.column_name, options.searchValue, (options.skip / options.take) + 1, options.take).then(data => {
                                                                    resolve({
                                                                        data: data.data,
                                                                        totalCount: data.recordsTotal
                                                                    });
                                                                });
                                                            });
                                                        },
                                                    }),
                                                }),
                                                noDataText: "Không có dữ liệu",
                                                pageSize: 25,
                                                paginate: true,
                                                showClearButton: true,
                                            },
                                            editorType: "dxSelectBox",
                                            label: {
                                                text: field.name_vn
                                            },

                                        };
                                    }
                                    if (field.is_required) {
                                        item["validationRules"] = [{
                                            message: "Vui lòng chọn thông tin " + field.name_vn,
                                            type: "required"
                                        }];
                                    }
                                    items.push(item);
                                });
                            }

                            // items.push({
                            //     template: (itemData, itemElement) => {

                            //     }
                            // });
                            self.filterForm.resetValues();
                            self.filterForm.beginUpdate();
                            self.filterForm.option("items", items);
                            self.filterForm.option("formData", self.formDataFilter);
                            self.filterForm.repaint();
                            self.filterForm.endUpdate();
                            self.reportTableToolbar.resetOption("items[0].options.totalCount");
                            setTimeout(() => {
                                self.filterFormScrollView.dxScrollView({
                                    height: 0
                                });
                                self.reportOptionsTreeView.option("height", (self.mainAccordionContainer.height() - self.filterFormScrollView.height() - self.reportToolbarBieuMau.element().outerHeight()) + "px");
                            }, 50);
                            // self.filterForm.option("disabled", false);
                            if (self.selectedReportType) {
                                if (self.selectedReportType.export_data_path) {
                                    self.reportToolbarBieuMau.option("items[0].options.disabled", false);
                                }
                                else {
                                    self.reportToolbarBieuMau.option("items[0].options.disabled", true);
                                }
                                if (self.selectedReportType.export_excel_path) {
                                    self.reportToolbarBieuMau.option("items[1].options.disabled", false);
                                }
                                else {
                                    self.reportToolbarBieuMau.option("items[1].options.disabled", true);
                                }
                                self.reportToolbarBieuMau.option("items[2].options.disabled", false);
                            }
                        }
                    });
                } else {
                    self.filterForm.resetValues();
                    self.filterForm.beginUpdate();
                    self.filterForm.option("items", []);
                    self.filterForm.option("formData", self.formDataFilter);
                    self.filterForm.repaint();
                    self.filterForm.endUpdate();
                    self.reportTableToolbar.option("visible", false);
                }
                self.reportTableIframe[0]["contentWindow"].document.open();
                self.reportTableIframe[0]["contentWindow"].document.write("");
                self.reportTableIframe[0]["contentWindow"].document.close();
            },
            searchEnabled: true,
            searchExpr: ["text"]
        }).dxTreeView("instance");
        this.filterFormScrollView = $("<div />").appendTo(this.mainAccordionContainer);
        self.reportToolbarBieuMau = $("<div />").appendTo(this.mainAccordionContainer)
            .dxToolbar({
                items: [{
                    location: "center",
                    options: {
                        disabled: true,
                        icon: "icon icon-login",
                        onClick: () => {
                            const validate = self.filterForm.validate();
                            if (validate && validate.brokenRules.length === 0) {
                                // OGUtils.showLoading();
                                self.pageIndex = 1;
                                // self.pageSize = 25;
                                self.loadReport();
                            }
                            else {
                                OGUtils.error(`${validate.brokenRules?.map(x => x?.message).join(" \n") ?? "Lỗi! Vui lòng thử lại sau"}`);
                                return;
                            }
                        },
                        // stylingMode: "contained",
                        text: "Xuất báo cáo",
                        type: "default"
                    },
                    visible: self.oGConfig.hasPermission("bao-cao-thong-ke.func.read"),
                    widget: "dxButton"
                }, {
                    location: "center",
                    options: {
                        disabled: true,
                        icon: "icon icon-receive-square",
                        onClick: () => {
                            if (self.selectedReportType.export_excel_path) {
                                const validate = self.filterForm.validate();
                                if (validate && validate.brokenRules.length === 0) {
                                    OGUtils.postDownload(self.selectedReportType.export_excel_path, {
                                        pageIndex: self.pageIndex,
                                        pageSize: self.pageSize,
                                        params: self.filterForm.option("formData"),
                                    }, "application/json");
                                }
                                else {
                                    OGUtils.error(`${validate.brokenRules?.map(x => x?.message).join(" \n") ?? "Lỗi! Vui lòng thử lại sau"}`);
                                    return;
                                }
                            }
                        },
                        // stylingMode: "contained",
                        text: "Xuất Excel",
                        type: "success"
                    },
                    visible: self.oGConfig.hasPermission("bao-cao-thong-ke.func.export"),
                    widget: "dxButton"
                }, {
                    location: "center",
                    options: {
                        disabled: true,
                        hint: "Hiển thị điều kiện lọc",
                        icon: "icon icon-document-filter",
                        onClick: () => {
                            self.toggleVisibilityItems();
                        },
                        type: "default"
                    },
                    widget: "dxButton"
                }, {
                    location: "center",
                    options: {
                        hint: "Thu gọn",
                        icon: "icon icon-backward",
                        onClick: () => {
                            if (self.mainAccordionContainer.hasClass("shown")) {
                                self.mainAccordionContainer.removeClass("shown");
                                self.mainAccordionContainer.css("display", "none");
                                self.reportContainer.css("margin-left", "0");
                            }
                        },
                        type: "danger",
                    },
                    widget: "dxButton"
                },]
            }).css("padding", "10px").dxToolbar("instance");
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
            height: this.mainAccordionContainer.height() - this.reportOptionsTreeView.element().outerHeight() - this.reportToolbarBieuMau.element().outerHeight()
        });
        $(document).on("click", ".report-button", (e) => {
            if (!self.mainAccordionContainer.hasClass("shown")) {
                self.mainAccordionContainer.addClass("shown");
                self.mainAccordionContainer.css("display", "");
                self.reportContainer.css("margin-left", "360px");
            }
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
                                            this.loadReport();
                                        },
                                        pageSize: this.pageSize,
                                        pageSizeChanged: (e) => {
                                            this.reportTableToolbar.resetOption("items[0].options.totalCount");
                                            this.pageSize = e;
                                            this.pageIndex = 1;
                                            this.loadReport();
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
    private loadReport(): void {
        const self = this;
        OGUtils.showLoading();
        self.reportTableToolbar.resetOption("items[0].options.totalCount");
        axios({
            data: JSON.stringify({
                pageIndex: self.pageIndex,
                pageSize: self.pageSize,
                params: self.filterForm.option("formData"),
            }),
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST",
            url: self.selectedReportType.export_data_path,
        }).then(result => {
            OGUtils.hideLoading();
            if (result.data.status === EnumStatus.OK) {
                OGUtils.hideLoading();
                self.reportTableIframe[0]["contentWindow"].document.open();
                self.reportTableIframe[0]["contentWindow"].document.write(result.data.data.view);
                self.reportTableIframe[0]["contentWindow"].document.close();
                if (result.data.data.totalCount) {
                    let pageCount = 0;
                    if (result.data.data.totalCount % this.pageSize == 0) {
                        pageCount = Math.floor(result.data.data.totalCount / self.pageSize);
                    } else {
                        pageCount = Math.floor(result.data.data.totalCount / self.pageSize) + 1;
                    }
                    self.reportTableToolbar.beginUpdate();
                    self.reportTableToolbar.option("visible", true);
                    self.reportTableToolbar.option("items[0].options.visible", true);
                    self.reportTableToolbar.option("items[0].options.pageIndex", self.pageIndex);
                    self.reportTableToolbar.option("items[0].options.pageSize", self.pageSize);
                    self.reportTableToolbar.option("items[0].options.pageCount", pageCount);
                    self.reportTableToolbar.option("items[0].options.totalCount", result.data.data.totalCount);
                    self.reportTableToolbar.endUpdate();
                }
                else {
                    self.reportTableToolbar.option("items[0].options.visible", false);
                    self.reportTableToolbar.option("visible", false);
                }
            }
            else {
                OGUtils.error(result.data);
            }
        }).catch(e => {
            OGUtils.hideLoading();
            OGUtils.error(e.response.data);
        });
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
    toggleVisibilityItems(): void {
        const self = this;
        const items = self.filterForm.option("items");
        let visible;
        for (let i = 0; i < items.length; i++) {
            const dataField = items[i]["dataField"];
            visible = items[i].visible;

            if (dataField && self.filterForm.itemOption(dataField)) {
                self.filterForm.itemOption(dataField, "visible", !visible);
            }
        }
        setTimeout(() => {
            self.filterFormScrollView.dxScrollView({
                height: !visible ? self.filterForm.element().outerHeight() : 0
            });
            self.reportOptionsTreeView.option("height", (this.mainAccordionContainer.height() - this.filterFormScrollView.height() - self.reportToolbarBieuMau.element().outerHeight()) + "px");
        }, 50);
    }
}

