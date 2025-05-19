import { LoadOptions } from "devextreme/data";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import "devextreme/ui/data_grid";
import dxDataGrid, { ColumnCellTemplateData, EditorPreparingEvent } from "devextreme/ui/data_grid";
import "devextreme/ui/form";
import dxForm from "devextreme/ui/form";
import "devextreme/ui/multi_view";
import dxMultiView from "devextreme/ui/multi_view";
import "devextreme/ui/popup";
import dxPopup from "devextreme/ui/popup";
import "devextreme/ui/select_box";
import "devextreme/ui/tag_box";

import { AttributesWindowComponent, AttributesWindowOption } from "../../../../../../../libs/core/components/attributes-window/attributes-window.component";
import { IBaseComponent } from "../../../../../../../libs/core/components/base-component.abstract";
import { SwitchModuleWindowComponent } from "../../../../../../../libs/core/components/switch-module-window/switch-module-window.component";
import { EnumStatus } from "../../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../../libs/core/helpers/utils";
import { OGConfigModel } from "../../../../../../../libs/core/models/config.model";
import { OGTableModel } from "../../../../../../../libs/core/models/table.model";
import { TableService } from "../../../../../../../libs/core/services/table.service";
import { DuLieuHeThongView } from "../du-lieu-he-thong/du-lieu-he-thong.view";
import { WorkspaceView } from "../workspace/workspace.view";
import { BaseLayerView } from "./base-layer/base-layers.view";
class TraCuuDuLieu implements IBaseComponent {
    attributesWindowComponent: AttributesWindowComponent;
    config: OGConfigModel;
    switchModule: SwitchModuleWindowComponent;
    tableGrid: dxDataGrid;
    tableSchema: string;
    tableSchemaStore: CustomStore;
    tableViewsContainer: JQuery<HTMLElement>;
    constructor(container: JQuery<HTMLElement>, config: OGConfigModel) {
        this.tableViewsContainer = container;
        this.config = config;
        this.onInit();
    }

    private initLayout(): void {

    }

    private initTableGrid(): void {
        $("<div />").appendTo(this.tableViewsContainer).dxTabPanel({
            animationEnabled: false,
            deferRendering: false,
            height: this.tableViewsContainer.height() - 50,
            itemTemplate: (itemData, itemIndex, itemElement) => {
                if (itemData.id === "data") {
                    new DuLieuHeThongView(itemElement, this.config);
                } else if (itemData.id == "workspace") {
                    new WorkspaceView(itemElement);
                }
                else {
                    new BaseLayerView(itemElement);
                }
            },
            itemTitleTemplate: (itemData) => {
                return itemData.text;
            },
            items: [{
                id: "data",
                text: "Thông tin lớp dữ liệu",
            }, {
                id: "workspace",
                text: "Bản đồ Workspace",
            }, {
                id: "base_layer",
                text: "Lớp nền bản đồ",
            },],
            loop: false,
            selectedIndex: 0,
            swipeEnabled: false,
        }).dxTabPanel("instance");
    }

    onInit(): void {
        $(".tab-item-container").css({
            "background-color": "white"
        }).height(window.innerHeight - $("header").outerHeight());
        this.attributesWindowComponent = new AttributesWindowComponent(null, {
            oGConfig: this.config,
            showButton: false
        } as AttributesWindowOption);
        this.switchModule = new SwitchModuleWindowComponent("table");
        this.tableSchemaStore = new CustomStore({
            byKey: (key) => {
                const def = $.Deferred();
                if (key) {
                    $.get("/api/table/schema/" + key).done(xhr => {
                        if (xhr.status === EnumStatus.OK) {
                            def.resolve(xhr.data);
                        } else {
                            def.resolve({});
                        }
                    });
                } else {
                    def.resolve({});
                }
                return def;
            },
            key: "schema_name",
            load: () => {
                const def = $.Deferred();
                $.get("/api/table/schema/list").done(xhr => {
                    if (xhr.status === EnumStatus.OK) {
                        def.resolve(xhr.data);
                    } else {
                        def.resolve({});
                    }
                });
                return def;
            },
            // loadMode: "raw"
        });
        this.initLayout();
        this.initTableGrid();
    }
}
export { TraCuuDuLieu };