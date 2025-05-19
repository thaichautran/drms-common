import { SwitchModuleWindowComponent } from "../../../../../../libs/core/components/switch-module-window/switch-module-window.component";
import { RazorView } from "../../../../../../libs/core/decorators/razor-view.decorator";
import { EnumMap } from "../../../../../../libs/core/enums/enums";
import { Layout } from "../../../../../../libs/core/layout";
import { CategoryView } from "./category/category.view";
import { HoSoGoiThauView } from "./hoso-goithau/hoso-goithau.view";
import { ThuMucView } from "./thu-muc/thu-muc.view";


@RazorView()
class DanhSachHoSoGoiThauView extends Layout {
    HoSoGoiThauView: HoSoGoiThauView;
    HoSoGoiThauViewContainer: JQuery<HTMLElement>;
    ThuMucView: ThuMucView;
    ThuMucViewContainer: JQuery<HTMLElement>;
    container: JQuery<HTMLElement>;
    electronicDocumentViewContainer: JQuery<HTMLElement>;
    maintenanceHistoryViewContainer: JQuery<HTMLElement>;
    // mapId: number;
    switchModule: SwitchModuleWindowComponent;
    constructor() {
        super("child", "Quản lý hồ sơ");
        // this.mapId = EnumMap.CHIEUSANG.id;
    }
    onInit(): void {
        $(".tab-item-container").css({
            "background-color": "white"
        }).height(window.innerHeight - $("#header").outerHeight());

        this.HoSoGoiThauViewContainer = $("#hoso-goithau-container");
        this.HoSoGoiThauView = new HoSoGoiThauView(this.HoSoGoiThauViewContainer);
        this.ThuMucViewContainer = $("#thu-muc-container");
        this.ThuMucView = new ThuMucView(this.ThuMucViewContainer);
        new CategoryView($("#category-view-container"));
        //
        this.switchModule = new SwitchModuleWindowComponent("layer");
    }
}