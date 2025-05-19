import { RazorView } from "../../../../../libs/core/decorators/razor-view.decorator";
import { OGUtils } from "../../../../../libs/core/helpers/utils";
import { MapLayout } from "../../../../../libs/core/map-layout";

@RazorView()
class MapView extends MapLayout {
    constructor() {
        super({
            allowSimulate: false,
            mapId: parseInt(OGUtils.getUrlParams("id")),
            title: "Bản đồ"
        });
    }

    protected onInitMap(): void {

    }
}