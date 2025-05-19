import "devextreme/ui/button";
import dxMultiView from "devextreme/ui/multi_view";
import "devextreme/ui/multi_view";
import "devextreme/ui/pager";
import dxToolbar from "devextreme/ui/toolbar";
import "devextreme/ui/toolbar";
import dxChart from "devextreme/viz/chart";
import "devextreme/viz/chart";
import dxPieChart from "devextreme/viz/pie_chart";
import "devextreme/viz/pie_chart";
import $ from "jquery";

import { IBaseComponent } from "../../base-component.abstract";
import SynthesisReportComponent from "../../synthesis-report/synthesis-report.component";
import ThematicReportComponent from "../../thematic-report/thematic-report.component";

class ReportViewOptions {
    currentReport: string;
    mapId: number;
    synthesiReportComponent?: SynthesisReportComponent;
    thematicReportComponent?: ThematicReportComponent;
}
class ReportViewComponent implements IBaseComponent {
    chartContainer: JQuery<HTMLElement>;
    container: JQuery<HTMLElement>;
    currentReport: string;
    mapId: number;
    pageIndex: number;
    pageSize: number;
    reportTableIframe: JQuery<HTMLElement>;
    reportTableToolbar: dxToolbar;
    reportView: dxMultiView;
    synthesiReport: SynthesisReportComponent;
    thematicReport: ThematicReportComponent;
    constructor(container: JQuery<HTMLElement>, options: ReportViewOptions) {
        this.pageIndex = 1;
        this.pageSize = 10;
        this.container = container;
        this.mapId = options.mapId;
        this.synthesiReport = options.synthesiReportComponent;
        this.thematicReport = options.thematicReportComponent;
        this.currentReport = options.currentReport;
        this.initLayout();
    }

    private initLayout(): void {
        this.reportView = $("<div />").appendTo(this.container)
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
                                            if (this.currentReport === "thematic") {
                                                this.thematicReport.query(this.pageIndex, 0).then(r => {
                                                    this.reportTableIframe[0]["contentWindow"].document.open();
                                                    this.reportTableIframe[0]["contentWindow"].document.write(r["content"]);
                                                    this.reportTableIframe[0]["contentWindow"].document.close();
                                                    this.reportTableIframe.get(0)["contentWindow"].print();
                                                });
                                            } else if (this.currentReport === "synthesis") {
                                                this.synthesiReport.query(this.pageIndex, 0).then(r => {
                                                    this.reportTableIframe[0]["contentWindow"].document.open();
                                                    this.reportTableIframe[0]["contentWindow"].document.write(r["content"]);
                                                    this.reportTableIframe[0]["contentWindow"].document.close();
                                                    this.reportTableIframe.get(0)["contentWindow"].print();
                                                });
                                            }

                                        },
                                        stylingMode: "contained",
                                        text: "In báo cáo",
                                        type: "default"
                                    },
                                    widget: "dxButton"
                                }, {
                                    location: "before",
                                    options: {
                                        elementAttr: {
                                            style: "margin: 6px 0;"
                                        },
                                        onClick: () => {
                                            if (this.currentReport === "thematic") {
                                                this.thematicReport.showSaveReport();
                                            } else if (this.currentReport === "synthesis") {
                                                this.synthesiReport.showSaveReport();
                                            }
                                        },
                                        stylingMode: "contained",
                                        text: "Lưu báo cáo",
                                        type: "success"
                                    },
                                    widget: "dxButton"
                                }, {
                                    location: "before",
                                    options: {
                                        elementAttr: {
                                            style: "margin: 6px 0;"
                                        },
                                        onClick: () => {
                                            if (this.currentReport === "thematic") {
                                                this.thematicReport.export();
                                            } else if (this.currentReport === "synthesis") {
                                                this.synthesiReport.export();
                                            }
                                        },
                                        stylingMode: "contained",
                                        text: "Xuất excel",
                                        type: "success"
                                    },
                                    widget: "dxButton"
                                }, {
                                    location: "after",
                                    options: {
                                        displayMode: "full",
                                        pageCount: 1,
                                        pageIndexChanged: (e) => {
                                            this.pageIndex = e;
                                            if (this.currentReport === "thematic") {
                                                this.thematicReport.query(this.pageIndex, this.pageSize).then(r => {
                                                    this.reportTableIframe[0]["contentWindow"].document.open();
                                                    this.reportTableIframe[0]["contentWindow"].document.write(r["content"]);
                                                    this.reportTableIframe[0]["contentWindow"].document.close();

                                                    this.reportTableToolbar.option("items[1].options.pageCount", r["pageCount"]);
                                                    this.reportTableToolbar.option("items[1].options.totalCount", r["totalCount"]);
                                                });
                                            } else if (this.currentReport === "synthesis") {
                                                this.synthesiReport.query(this.pageIndex, this.pageSize).then(r => {
                                                    this.reportTableIframe[0]["contentWindow"].document.open();
                                                    this.reportTableIframe[0]["contentWindow"].document.write(r["content"]);
                                                    this.reportTableIframe[0]["contentWindow"].document.close();

                                                    this.reportTableToolbar.option("items[1].options.pageCount", r["pageCount"]);
                                                    this.reportTableToolbar.option("items[1].options.totalCount", r["totalCount"]);
                                                });
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

                                                    this.reportTableToolbar.option("items[1].options.pageSize", this.pageSize);
                                                    this.reportTableToolbar.option("items[1].options.pageCount", r["pageCount"]);
                                                    this.reportTableToolbar.option("items[1].options.totalCount", r["totalCount"]);
                                                });
                                            } else if (this.currentReport === "synthesis") {
                                                this.synthesiReport.query(this.pageIndex, this.pageSize).then(r => {
                                                    this.reportTableIframe[0]["contentWindow"].document.open();
                                                    this.reportTableIframe[0]["contentWindow"].document.write(r["content"]);
                                                    this.reportTableIframe[0]["contentWindow"].document.close();

                                                    this.reportTableToolbar.option("items[1].options.pageSize", this.pageSize);
                                                    this.reportTableToolbar.option("items[1].options.pageCount", r["pageCount"]);
                                                    this.reportTableToolbar.option("items[1].options.totalCount", r["totalCount"]);
                                                });
                                            }
                                        },
                                        pageSizes: [10, 15, 50],
                                        showInfo: true,
                                        showNavigationButtons: true,
                                        showPageSizeSelector: true
                                    },
                                    widget: "dxPager",
                                }]
                            }).dxToolbar("instance");

                        this.reportTableIframe = $("<iframe />")
                            .prop("frameborder", "0")
                            .css("width", "100%")
                            .css("overflow", "hidden")
                            .appendTo(element);
                        if (this.currentReport === "thematic") {
                            this.reportTableIframe.css("height", (this.container.height() - this.reportTableToolbar.element().outerHeight()).toString() + "px");
                        } else if (this.currentReport === "synthesis") {
                            this.reportTableIframe.css("height", (this.container.height() - this.reportTableToolbar.element().outerHeight() - 30).toString() + "px");
                        }
                    }
                }, {
                    template: (data, index, element) => {
                        this.chartContainer = $("<div class=\"chart-container\" style=\"height: 100%;\" />").appendTo(element);
                    }
                }]
            }).dxMultiView("instance");
    }

    public bindReport(r): void {
        this.reportTableIframe[0]["contentWindow"].document.open();
        this.reportTableIframe[0]["contentWindow"].document.write(r.content);
        this.reportTableIframe[0]["contentWindow"].document.close();

        this.reportTableToolbar.option("items[3].options.pageCount", r.pageCount);
        this.reportTableToolbar.option("items[3].options.totalCount", r.totalCount);
        this.reportTableToolbar.option("items[3].options.showInfo", true);
    }
    public getChartContainer(): JQuery<HTMLElement> {
        return this.chartContainer;
    }

    public getReportTableIframe(): JQuery<HTMLElement> {
        return this.reportTableIframe;
    }

    public getReportView(): dxMultiView {
        return this.reportView;
    }
    onInit(): void {

    }
}

export { ReportViewComponent };