import { ReportComponent } from "../../../../../../libs/core/components/report/report.component";
import SynthesisReportComponent from "../../../../../../libs/core/components/synthesis-report/synthesis-report.component";
import { EnumMap } from "../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../libs/core/helpers/utils";
import { Layout } from "../../../../../../libs/core/layout";
import "./report.view.scss";

export default class ReportView extends Layout {
    container: JQuery<HTMLElement>;
    mapId: number;
    synthesisReport: SynthesisReportComponent;
    constructor() {
        super("child", "Báo cáo");
        this.container = $("#report-container");
        this.mapId = parseInt(OGUtils.getUrlParams("mapId"));
    }

    onInit(): void {
        new ReportComponent(this.container, {
            mapId: this.mapId
        });
    }
}

new ReportView();