import { OGMap } from "@opengis/map";
import dxTreeView from "devextreme/ui/tree_view";

import { EnumStatus } from "../../enums/enums";
import { AreaService } from "../../services/area.service";
import { MapService } from "../../services/map.service";
import { IMapComponent } from "../base-component.abstract";
import "./region-tree.component.scss";

interface RegionTreeOption {
    container: JQuery<HTMLElement>;
    mapId: number;
    oGMap: OGMap;
}

class RegionTreeComponent implements IMapComponent {
    container: JQuery<HTMLElement>;
    mapId: number;
    oGMap: OGMap;
    tree: dxTreeView;
    constructor(options: RegionTreeOption) {
        this.oGMap = options.oGMap;
        this.container = options.container;
        this.mapId = options.mapId;
        this.onInit();
    }

    onInit(): void {
        this.tree = $("<div />").addClass("region-tree").appendTo(this.container).dxTreeView({
            createChildren: (parent) => {
                if (parent === null || parent === undefined) {
                    return $.get("/api/map/tree-regions", {
                        mapId: this.mapId
                    });
                } else {
                    const parent_id = parent ? parent.itemData.id : "";
                    return $.get("/api/region/get-by-id", { id: parent_id });
                }
            },
            dataStructure: "plain",
            expandedExpr: "isExpanded",
            height: "100%",
            itemTemplate: (itemData, itemIndex, element) => {
                if (itemData.parentId) {
                    element.append("<i class=\"dx-icon icon icon-global\"></i>");
                    element.append("<span class=\"region-item\">" + itemData.text + "</span>");
                } else {
                    element.append("<i class=\"dx-icon icon icon-global\"></i>");
                    element.append("<span class=\"region-group-item\">" + itemData.text + "</span>");
                }
            },
            noDataText: "Không có dữ liệu",
            onItemClick: (e) => {
                const node = e.node;
                if (node != null) {
                    AreaService.shape(node.itemData.id.toString()).then(result => {
                        if (result) {
                            this.oGMap.loadBoundary(result);
                        }
                    });
                }
            },
            rootValue: 0,
            width: "100%"
        }).dxTreeView("instance");
    }
}

export { RegionTreeComponent };
