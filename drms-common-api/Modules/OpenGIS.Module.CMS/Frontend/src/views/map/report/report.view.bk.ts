import dxMultiView from "devextreme/ui/multi_view";
import "devextreme/ui/multi_view";
import dxToolbar from "devextreme/ui/toolbar";
import "devextreme/ui/toolbar";
import dxChart from "devextreme/viz/chart";
import "devextreme/viz/chart";
import dxPieChart from "devextreme/viz/pie_chart";
import "devextreme/viz/pie_chart";
import "devextreme/ui/button";
import "devextreme/ui/pager";
import $ from "jquery";

import ThematicReportComponent from "../../../../../../libs/core/components/thematic-report/thematic-report.component";
import { EnumMap } from "../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../libs/core/helpers/utils";
import { Layout } from "../../../../../../libs/core/layout";
import "./report.view.scss";

export default class ReportView extends Layout {
    chart: dxChart | dxPieChart;
    chartContainer: JQuery<HTMLElement>;
    container: JQuery<HTMLElement>;
    currentReport: string;
    mainAccordionContainer: JQuery<HTMLElement>;
    mapId: number;
    pageIndex: number;
    pageSize: number;
    reportContainer: JQuery<HTMLElement>;
    reportTableIframe: JQuery<HTMLElement>;
    reportTableToolbar: dxToolbar;
    reportView: dxMultiView;
    thematicReport: ThematicReportComponent;
    constructor() {
        super("child", "Báo cáo");
        this.pageIndex = 1;
        this.pageSize = 10;
        this.container = $("#report-container");
        this.mapId = EnumMap.DUNGCHUNG.id;
    }

    onInit(): void {
        $(".tab-item-container").css({
            "background-color": "white"
        }).height(window.innerHeight - $("#header").outerHeight());
        this.mainAccordionContainer = $("<div />").appendTo(this.container).height("100%").css("width", "360px").css("float", "left");
        this.reportContainer = $("<div />").appendTo(this.container).height(window.innerHeight - $("#header").outerHeight() - 15)
            .css("margin-left", "360px").css("border-left", "1px solid #ddd");

        this.reportView = $("<div />").appendTo(this.reportContainer)
            .dxMultiView({
                height: "100%",
                items: [{
                    template: (data, index, element) => {
                        // thematic
                        this.reportTableToolbar = $("<div />").css("padding", "0 10px").appendTo(element)
                            .dxToolbar({
                                items: [{
                                    location: "before",
                                    options: {
                                        elementAttr: {
                                            style: "margin: 6px 0;"
                                        },
                                        onClick: () => {
                                            this.reportTableIframe.get(0)["contentWindow"].print();
                                        },
                                        stylingMode: "contained",
                                        text: "In báo cáo",
                                        type: "default"
                                    },
                                    widget: "dxButton"
                                }, {
                                    location: "after",
                                    options: {
                                        pageCount: 1,
                                        pageIndexChanged: (e) => {
                                            this.pageIndex = e;
                                            // if (this.g_Check) {
                                            //     this._queryGeneralReport();
                                            // } else {
                                            //     Utils.showLoading();
                                            //     this._getReport();
                                            //     Utils.hideLoading();
                                            // }
                                            if (this.currentReport === "thematic") {
                                                this.thematicReport.query(this.pageIndex, this.pageSize).then(r => {
                                                    this.reportTableIframe[0]["contentWindow"].document.open();
                                                    this.reportTableIframe[0]["contentWindow"].document.write(r["content"]);
                                                    this.reportTableIframe[0]["contentWindow"].document.close();
                                                    //
                                                    this.reportTableToolbar.option("items[1].options.pageCount", r["pageCount"]);
                                                    this.reportTableToolbar.option("items[1].options.totalCount", r["totalCount"]);
                                                });
                                            } else if (this.currentReport === "synthesis") {
                                                // this.g_SynthesiReport.query(this.pageIndex, this.pageSize).then(r => {
                                                //     this.reportTableIframe[0].contentWindow.document.open();
                                                //     this.reportTableIframe[0].contentWindow.document.write(r.content);
                                                //     this.reportTableIframe[0].contentWindow.document.close();
                                                //     //
                                                //     this.reportTableToolbar.option("items[1].options.pageCount", r.pageCount);
                                                //     this.reportTableToolbar.option("items[1].options.totalCount", r.totalCount);
                                                // });
                                            }
                                        },
                                        pageSize: 10,
                                        pageSizeChanged: (e) => {
                                            this.pageSize = e;
                                            this.pageIndex = 1;
                                            if (this.currentReport === "thematic") {
                                                this.thematicReport.query(this.pageIndex, this.pageSize).then(r => {
                                                    this.reportTableIframe[0]["contentWindow"].document.open();
                                                    this.reportTableIframe[0]["contentWindow"].document.write(r["content"]);
                                                    this.reportTableIframe[0]["contentWindow"].document.close();
                                                    //
                                                    this.reportTableToolbar.option("items[1].options.pageSize", this.pageSize);
                                                    this.reportTableToolbar.option("items[1].options.pageCount", r["pageCount"]);
                                                    this.reportTableToolbar.option("items[1].options.totalCount", r["totalCount"]);
                                                });
                                            } else if (this.currentReport === "synthesis") {
                                                // this.g_SynthesiReport.query(this.pageIndex, this.pageSize).then(r => {
                                                //     this.reportTableIframe[0].contentWindow.document.open();
                                                //     this.reportTableIframe[0].contentWindow.document.write(r.content);
                                                //     this.reportTableIframe[0].contentWindow.document.close();
                                                //     //
                                                //     this.reportTableToolbar.option("items[1].options.pageSize", this.pageSize);
                                                //     this.reportTableToolbar.option("items[1].options.pageCount", r.pageCount);
                                                //     this.reportTableToolbar.option("items[1].options.totalCount", r.totalCount);
                                                // });
                                            }
                                        },
                                        /*displayMode: 'compact',*/
                                        pageSizes: [10, 15, 50],
                                        showInfo: true,
                                        showNavigationButtons: true,
                                        showPageSizeSelector: true,
                                    },
                                    widget: "dxPager",
                                }]
                            }).dxToolbar("instance");

                        this.reportTableIframe = $("<iframe />")
                            .prop("frameborder", "0")
                            .css("width", "100%")
                            .css("overflow", "hidden")
                            .css("height", (this.reportContainer.height() - this.reportTableToolbar.element().outerHeight()).toString() + "px")
                            .appendTo(element);
                    }
                }, {
                    template: (data, index, element) => {
                        this.chartContainer = $("<div class=\"chart-container\" style=\"height: 100%;\" />").appendTo(element);
                    }
                }]
            }).dxMultiView("instance");

        this.thematicReport = new ThematicReportComponent(this.mainAccordionContainer, {
            mapId: this.mapId,
            onExportChartClick: (e) => {
                if (this.chart) {
                    this.chart.dispose();
                    this.chartContainer.empty();
                }

                this.reportView.option("selectedIndex", 1);

                e.exportChart().then(c => {
                    if (c.chart_type === "bar-chart" || c.chart_type === "line-chart") {
                        this.chart = $("<div />").css("padding", "10px").css("height", "100%").appendTo(this.chartContainer).dxChart({
                            commonAxisSettings: {
                                allowDecimals: false,
                                endOnTick: true,
                                label: {
                                    displayMode: "rotate",
                                    // rotationAngle: "-45",
                                },
                            },
                            commonSeriesSettings: {
                                barWidth: 40
                            },
                            customizeLabel() {
                                return {
                                    backgroundColor: "white",
                                    customizeText() {
                                        return `${this.valueText}`;
                                    },
                                    font: {
                                        color: "black"
                                    },
                                    visible: true
                                };
                            },
                            customizePoint() {
                                //if (this.value > highAverage) {
                                //    return { color: '#ff7c7c', hoverStyle: { color: '#ff7c7c' } };
                                //}
                                //if (this.value < lowAverage) {
                                //    return { color: '#8c8cff', hoverStyle: { color: '#8c8cff' } };
                                //}
                                return this.value;
                            },
                            dataSource: {
                                store: c.data
                            },
                            height: "100%",
                            legend: {
                                horizontalAlignment: "center",
                                itemTextPosition: "top",
                                verticalAlignment: "top",
                            },
                            scrollBar: {
                                visible: true,
                            },
                            series: {
                                argumentField: "category_name",
                                color: OGUtils.rainbow(1, 1),
                                name: c.legend,
                                type: c.chart_type.replace("-chart", ""),
                                valueField: "count"
                            },
                            size: {
                                // height: "100%",
                                // widht: "100%",
                            },
                            title: {
                                font: {
                                    family: "'Reddit Sans', Open Sans, Helvetica Neue, Segoe UI, Helvetica, Verdana, sans-serif",
                                    size: 20,
                                    weight: 400
                                },
                                text: c.title
                            },
                            tooltip: {
                                contentTemplate: (info, container) => {
                                    return $("<b />").text(`${info.valueText} bản ghi thuộc ${info.argumentText}`).appendTo(container);
                                },
                                enabled: true,
                                paddingLeftRight: 10,
                                paddingTopBottom: 5,
                            },
                            zoomAndPan: {
                                argumentAxis: "both",
                            }
                        }).dxChart("instance");
                    } else if (c.chart_type === "pie-chart") {
                        this.chart = $("<div  />").css("padding", "10px").css("height", "100%").appendTo(this.chartContainer).dxPieChart({
                            customizePoint: (e) => {
                                if (c.colors) {
                                    return {
                                        color: c.colors[e.argument]
                                    };
                                }
                                return {
                                    color: OGUtils.rainbow(1, 1)
                                };
                            },
                            dataSource: {
                                store: c.data
                            },
                            series: [{
                                argumentField: "category_name",
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
                                name: c.legend,
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
                                text: c.title
                            },
                            tooltip: {
                                contentTemplate: (info, container) => {
                                    return $("<b />").text(`${info.valueText} bản ghi thuộc ${info.argumentText}`).appendTo(container);
                                },
                                enabled: true,
                                paddingLeftRight: 10,
                                paddingTopBottom: 5,
                            }
                        }).dxPieChart("instance");
                    }
                });
            },
            onQueryReportClick: (e) => {
                this.currentReport = "thematic";
                this.reportView.option("selectedIndex", 0);
                //
                e.query(this.pageIndex, this.pageSize).then(r => {
                    this.reportTableIframe[0]["contentWindow"].document.open();
                    this.reportTableIframe[0]["contentWindow"].document.write(r.content);
                    this.reportTableIframe[0]["contentWindow"].document.close();
                    //
                    this.reportTableToolbar.option("items[1].options.pageCount", r.pageCount);
                    this.reportTableToolbar.option("items[1].options.totalCount", r.totalCount);
                });
            },
        });
        //

    }
}

new ReportView();