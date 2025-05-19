import "devextreme/ui/button";
import dxMultiView from "devextreme/ui/multi_view";
import "devextreme/ui/multi_view";
import "devextreme/ui/pager";
import dxTabPanel from "devextreme/ui/tab_panel";
import dxToolbar from "devextreme/ui/toolbar";
import "devextreme/ui/toolbar";
import dxChart from "devextreme/viz/chart";
import "devextreme/viz/chart";
import dxPieChart from "devextreme/viz/pie_chart";
import "devextreme/viz/pie_chart";

import { OGUtils } from "../../helpers/utils";
import { OGSynthesisReportModel } from "../../models/report.model";
import { IBaseComponent } from "../base-component.abstract";
import SynthesisReportComponent from "../synthesis-report/synthesis-report.component";
import ThematicReportComponent from "../thematic-report/thematic-report.component";
import "./report.component.scss";
import { ReportViewComponent } from "./report-view/report-view.component";

class ReportOptions {
    mapId: number;
}
class ReportComponent implements IBaseComponent {
    container: JQuery<HTMLElement>;
    currentReport: string;
    mainAccordionContainer: JQuery<HTMLElement>;
    mapId: number;
    pageIndex: number;
    pageSize: number;
    reportContainer: JQuery<HTMLElement>;
    reportTableToolbar: dxToolbar;
    reportTreeContainer: JQuery<HTMLElement>;
    reportView: dxMultiView;
    selectedReport: OGSynthesisReportModel;
    synthesisChart: dxChart | dxPieChart;
    synthesisChartContainer: JQuery<HTMLElement>;
    synthesisReport: SynthesisReportComponent;
    synthesisReportContainer: JQuery<HTMLElement>;
    synthesisReportTabs: dxTabPanel;
    synthesisReportView: ReportViewComponent;
    thematicChart: dxChart | dxPieChart;
    thematicChartContainer: JQuery<HTMLElement>;
    thematicReport: ThematicReportComponent;
    thematicReportContainer: JQuery<HTMLElement>;
    thematicReportView: ReportViewComponent;
    constructor(container: JQuery<HTMLElement>, options: ReportOptions) {
        this.pageIndex = 1;
        this.pageSize = 10;
        this.container = container;
        this.mapId = options.mapId;
        this.initLayout();
    }

    private initLayout(): void {
        $(".tab-item-container").css({
            "background-color": "white"
        }).height(window.innerHeight - $("#header").outerHeight());
        this.thematicReportContainer = $("#thematic-report-container");
        this.synthesisReportContainer = $("#synthesis-report-container");

        this.initSynthesisView(this.synthesisReportContainer);
        this.initThematicView(this.thematicReportContainer);

    }

    private initSynthesisView(container): void {
        const self = this;
        this.synthesisReportTabs = $("<div />").appendTo(container).dxTabPanel({
            animationEnabled: false,
            deferRendering: false,
            height: "100%",
            itemTemplate: (itemData, itemIndex, itemElement) => {
                itemElement.height(window.innerHeight - $("#header").outerHeight() - 55);
                if (itemData.id === "ConfigReport") {
                    this.synthesisReport = new SynthesisReportComponent(itemElement, {
                        mapId: this.mapId,
                        onExportChartClick: (e) => {
                            if (this.synthesisChart) {
                                this.synthesisChart.dispose();
                            }
                            this.synthesisReportView.getReportView().option("selectedIndex", 1);
                            e.exportChart().then(c => {
                                this.synthesisChartContainer = this.synthesisReportView.getChartContainer();
                                this.synthesisChartContainer.empty();

                                if (c.chart_type === "bar-chart" || c.chart_type === "line-chart") {
                                    this.synthesisChart = $("<div />").css("padding", "10px").css("height", "100%").appendTo(this.synthesisChartContainer).dxChart({
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
                                                // return $("<b />").text(`${info.valueText} thuộc ${info.argumentText}`).appendTo(container);
                                                return $("<b />").text(`${info.valueText}`).appendTo(container);
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
                                    this.synthesisChart = $("<div  />").css("padding", "10px").css("height", "100%").appendTo(this.synthesisChartContainer).dxPieChart({
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
                                                // return $("<b />").text(`${info.valueText} thuộc ${info.argumentText}`).appendTo(container);
                                                return $("<b />").text(`${info.valueText}`).appendTo(container);
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
                            this.currentReport = "synthesis";
                            this.synthesisReportView.getReportView().option("selectedIndex", 0);

                            e.query(this.pageIndex, this.pageSize).then(r => {
                                this.synthesisReportView.bindReport(r);
                                this.synthesisReportTabs.option("selectedIndex", 1);
                            });
                        },
                    });
                } else if (itemData.id == "ReportView") {
                    this.synthesisReportView = new ReportViewComponent(itemElement, {
                        currentReport: "synthesis",
                        mapId: this.mapId,
                        synthesiReportComponent: this.synthesisReport
                    });
                }
            },
            itemTitleTemplate: (itemData) => {
                return itemData.text;
            },
            items: [{
                id: "ConfigReport",
                text: "Thiết lập báo cáo"
            }, {
                id: "ReportView",
                text: "Kết quả báo cáo"
            }],
            loop: false,
            selectedIndex: 0,
            swipeEnabled: false,
        }).dxTabPanel("instance");
    }

    private initThematicView(container): void {
        this.mainAccordionContainer = $("<div />").appendTo(container).height("100%").css("width", "360px").css("float", "left");
        this.reportContainer = $("<div />").appendTo(container).height(window.innerHeight - $("#header").outerHeight() - 15)
            .css("margin-left", "360px").css("border-left", "1px solid #ddd");

        this.thematicReport = new ThematicReportComponent(this.mainAccordionContainer, {
            mapId: this.mapId,
            onExportChartClick: (e) => {
                if (this.thematicChart) {
                    this.thematicChart.dispose();
                }
                this.thematicReportView.getReportView().option("selectedIndex", 1);

                e.exportChart().then(c => {
                    this.thematicChartContainer = this.thematicReportView.getChartContainer();
                    this.thematicChartContainer.empty();
                    if (c.chart_type === "bar-chart" || c.chart_type === "line-chart") {
                        this.thematicChart = $("<div />").css("padding", "10px").css("height", "100%").appendTo(this.thematicChartContainer).dxChart({
                            commonAxisSettings: {
                                allowDecimals: false,
                                endOnTick: true,
                                label: {
                                    displayMode: "rotate",
                                    rotationAngle: 45
                                },
                            },
                            commonSeriesSettings: {
                                barWidth: 40
                            },
                            customizeLabel() {
                                return {
                                    backgroundColor: "white",
                                    customizeText() {
                                        return `${OGUtils.formatNumber(this.valueText, 0, 2)}`;
                                        // return `${this.valueText}`;
                                    },
                                    font: {
                                        color: "black"
                                    },
                                    visible: false
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
                            export: {
                                enabled: true,
                                fileName: "DuLieuBieuDo",
                                formats: ["PNG", "JPEG"],
                                printingEnabled: false
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
                                    // return $("<b />").text(`${info.valueText} thuộc ${info.argumentText}`).appendTo(container);
                                    const value = parseFloat(info.valueText);
                                    if (value % 1 === 0) {
                                        return $("<b />").text(`${OGUtils.formatNumber(value, 0, 0)}`).appendTo(container);
                                    } else {
                                        return $("<b />").text(`${OGUtils.formatNumber(value, 0, 2)}`).appendTo(container);
                                    }
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
                        this.thematicChart = $("<div  />").css("padding", "10px").css("height", "100%").appendTo(this.thematicChartContainer).dxPieChart({
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
                            export: {
                                enabled: true,
                                fileName: "DuLieuBieuDo",
                                formats: ["PNG", "JPEG"],
                                printingEnabled: false
                            },
                            // size: {
                            //     height: "100%",
                            //     widht: "100%",
                            series: [{
                                argumentField: "category_name",
                                label: {
                                    connector: {
                                        visible: true,
                                        width: 1
                                    },
                                    customizeText(arg) {
                                        return `${OGUtils.formatNumber(arg.valueText, 0, 2)} (${arg.percentText})`;
                                    },
                                    visible: true,
                                },
                                name: c.legend,
                                valueField: "count"
                            }],
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
                                    // return $("<b />").text(`${info.valueText} thuộc ${info.argumentText}`).appendTo(container);
                                    return $("<b />").text(`${info.argumentText}: ${OGUtils.formatNumber(info.valueText, 0, 2)}`).appendTo(container);
                                },
                                enabled: true,
                                paddingLeftRight: 10,
                                paddingTopBottom: 5,
                            },
                        }).dxPieChart("instance");
                    }
                });
            },
            onQueryReportClick: (e) => {
                this.currentReport = "thematic";
                this.thematicReportView.getReportView().option("selectedIndex", 0);
                e.query(this.pageIndex, this.pageSize).then(r => {
                    console.log(r);
                    this.thematicReportView.bindReport(r);
                });
            },
            synthesisReportComponent: this.synthesisReport
        });

        this.thematicReportView = new ReportViewComponent(this.reportContainer, {
            currentReport: "thematic",
            mapId: this.mapId,
            thematicReportComponent: this.thematicReport
        });
    }
    onInit(): void {

    }
}

export { ReportComponent };