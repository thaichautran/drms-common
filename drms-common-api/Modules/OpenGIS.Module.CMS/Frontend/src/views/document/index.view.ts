import { RazorView } from "../../../../../libs/core/decorators/razor-view.decorator";
import { EnumMap } from "../../../../../libs/core/enums/enums";
import { Layout } from "../../../../../libs/core/layout";
import { TaiLieuSoView } from "./tai-lieu-so/tai-lieu-so.view";
@RazorView()
class DocumentView extends Layout {
    container: JQuery<HTMLElement> ;
    mapId: number;
    taiLieuSoView: TaiLieuSoView;
    taiLieuSoViewContainer: JQuery<HTMLElement>;
    constructor() {
        super("child", "Quản lý hồ sơ");
    }
    
    onInit(): void {
        $(".tab-item-container").css({
            "background-color": "white"
        }).height(window.innerHeight - $("#header").outerHeight());
        
        this.taiLieuSoViewContainer = $("#tailieuso-container");
        this.taiLieuSoView = new TaiLieuSoView(this.taiLieuSoViewContainer);
    } 
}
