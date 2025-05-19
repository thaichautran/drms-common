import axios from "axios";
import CustomStore from "devextreme/data/custom_store";
import dxDataGrid from "devextreme/ui/data_grid";

import { MaintenancePlanView } from "../../../../../../libs/core/components/maintenance-plan/maintenance-plan.view";
import { RazorView } from "../../../../../../libs/core/decorators/razor-view.decorator";
import { EnumMap } from "../../../../../../libs/core/enums/enums";
import { MapLayout } from "../../../../../../libs/core/map-layout";
import { MaintenanceView } from "./maintenance/maintenance.view";
import "./monitoring.view.scss";

@RazorView()
class UrbanGreenMonitoringView extends MapLayout {
    arguments: object;
    loaiKiemTraId: number;
    maintenanceContainer: JQuery<HTMLElement>;
    maintenanceGrid: dxDataGrid;
    maintenancePlanContainer: JQuery<HTMLElement>;
    maintenancePlanView: MaintenancePlanView;
    maintenanceView: MaintenanceView;
    constructor() {
        super({
            allowSimulate: true,
            loaiKiemTra: EnumMap.VITRI_SUCO.text,
            mapId: EnumMap.VITRI_SUCO.id,
            title: "Vận hành, kiểm tra"
        });
    }

    protected onInitMap(): void {
        this.maintenanceContainer = $("#maintenanceContainer");
        this.maintenancePlanContainer = $("#maintenancePlanContainer");
        this.maintenanceView = new MaintenanceView(this.maintenanceContainer, {
            config: this.config,
            loaiKiemTra: EnumMap.VITRI_SUCO.text,
            loaiNhanVienId: EnumMap.VITRI_SUCO.id,
            mapId: EnumMap.VITRI_SUCO.id,
        });
        this.maintenancePlanView = new MaintenancePlanView(this.maintenancePlanContainer, {
            config: this.config,
            loaiKiemTra: EnumMap.VITRI_SUCO.text,
            loaiNhanVienId: EnumMap.VITRI_SUCO.id,
            mapId: EnumMap.VITRI_SUCO.id,
        });
    }

}