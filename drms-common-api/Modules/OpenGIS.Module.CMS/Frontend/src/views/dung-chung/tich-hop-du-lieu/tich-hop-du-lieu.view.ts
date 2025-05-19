import { SwitchModuleWindowComponent } from "../../../../../../libs/core/components/switch-module-window/switch-module-window.component";
import { RazorView } from "../../../../../../libs/core/decorators/razor-view.decorator";
import { EnumMap } from "../../../../../../libs/core/enums/enums";
import { Layout } from "../../../../../../libs/core/layout";
import { ChiaSeAPIView } from "./chia-se-api/chia-se-api.view";
import { ChiaSeDuLieuView } from "./chia-se-du-lieu/chia-se-du-lieu.view";
import { DangKyDuLieuView } from "./dang-ky-du-lieu/dang-ky-du-lieu.view";
import { DuLieuHeThongView } from "./du-lieu-he-thong/du-lieu-he-thong.view";
import { KichHoatModuleView } from "./kich-hoat-module/kich-hoat-module.view";
import { PhanPhoiDuLieuView } from "./phan-phoi-du-lieu/phan-phoi-du-lieu.view";
import { QuanTriLogView } from "./quan-tri-log/quan-tri-log.view";
import { ThietLapBaoCaoView } from "./thiet-lap-bao-cao/thiet-lap-bao-cao.view";
import { ThietLapNguonSoLieuView } from "./thiet-lap-nguon-solieu/thiet-lap-nguon-solieu.view";
import { ThietLapThoiGianTichHopView } from "./thiet-lap-tich-hop/thiet-lap-tich-hop.view";
import "./tich-hop-du-lieu.style.scss";
import { TichHopGISView } from "./tich-hop-gis/tich-hop-gis.view";
import { TraCuuDuLieu } from "./tra-cuu-du-lieu/tra-cuu-du-lieu.view";
import { WorkspaceView } from "./workspace/workspace.view";

@RazorView()
class TichHopDuLieuView extends Layout {
    HoSoGoiThauViewContainer: JQuery<HTMLElement>;
    ThuMucViewContainer: JQuery<HTMLElement>;
    container: JQuery<HTMLElement>;
    electronicDocumentViewContainer: JQuery<HTMLElement>;
    maintenanceHistoryViewContainer: JQuery<HTMLElement>;
    // mapId: number;
    switchModule: SwitchModuleWindowComponent;
    constructor() {
        super("child", "Tích hợp dữ liệu");
        // this.mapId = EnumMap.CHIEUSANG.id;
    }
    onInit(): void {
        $(".tab-item-container").css({
            "background-color": "white"
        }).height(window.innerHeight - $("#header").outerHeight());
        // $("#tabs-sidebar").dxScrollView({
        //     height: "50vh",
        //     showScrollbar: "always"
        // });
        new ChiaSeDuLieuView($("#ketnoi-chiase-dulieu-container"));
        new TichHopGISView($("#tichhop-gis-container"), this.config);
        new WorkspaceView($("#map-container"));
        new ThietLapThoiGianTichHopView($("#thoigian-tichhop-dulieu-container"), this.config);
        new QuanTriLogView($("#quantri-log-container"));
        new DangKyDuLieuView($("#dangky-dulieu-container"), this.config);
        new PhanPhoiDuLieuView($("#phanphoi-dulieu-container"), this.config);
        new DuLieuHeThongView($("#dulieu-hethong-container"), this.config);
        new TraCuuDuLieu($("#tracuu-dulieu-container"), this.config);
        new KichHoatModuleView($("#kichhoat-module-container"));
        new ChiaSeAPIView($("#chia-se-api-container"));
        new ThietLapBaoCaoView($("#thietlap-baocao-container"));
        new ThietLapNguonSoLieuView($("#thietlap-nguon-solieu-container"));
        this.switchModule = new SwitchModuleWindowComponent("layer");
    }
}