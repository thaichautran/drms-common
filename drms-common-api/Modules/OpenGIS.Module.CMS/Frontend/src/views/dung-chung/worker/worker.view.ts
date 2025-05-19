import { CareWorkerComponent } from "../../../../../../libs/core/components/care-worker/care-worker.component";
import { SupervisionReportComponent } from "../../../../../../libs/core/components/supervision-report/supervision-report.component";
import { TimeKeepingReportComponent } from "../../../../../../libs/core/components/timekeeping-report/timekeeping-report.component";
import { RazorView } from "../../../../../../libs/core/decorators/razor-view.decorator";
import { EnumMap } from "../../../../../../libs/core/enums/enums";
import { Layout } from "../../../../../../libs/core/layout";

@RazorView()
class WorkerView extends Layout {
    careWorkerView: CareWorkerComponent;
    loaiNhanVienId: number;
    supervisionReportView: SupervisionReportComponent;
    timeKeepingReportView: TimeKeepingReportComponent;

    constructor() {
        super("child", "Dùng chung - Quản lý nhân viên");
        this.loaiNhanVienId = EnumMap.VITRI_SUCO.id;
    }
    onInit(): void {
        $(".tab-item-container").css({
            "background-color": "white"
        }).height(window.innerHeight - $("#header").outerHeight() - 15);

        const careWorkerContainer = $("#care-worker-container");
        const monitoringReportContainer = $("#monitoring-report-container");
        const timKeepingReportContainer = $("#timekeeping-report-container");
        this.careWorkerView = new CareWorkerComponent(careWorkerContainer, this.loaiNhanVienId);
        this.supervisionReportView = new SupervisionReportComponent(monitoringReportContainer, this.loaiNhanVienId);
        this.timeKeepingReportView = new TimeKeepingReportComponent(timKeepingReportContainer, this.loaiNhanVienId);
    }
}