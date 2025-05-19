import axios from "axios";
import Handlebars from "handlebars";

import { RazorView } from "../../../../../libs/core/decorators/razor-view.decorator";
import { EnumStatus } from "../../../../../libs/core/enums/enums";
import { Layout } from "../../../../../libs/core/layout";
import ModuleItemTemplate from "../../../../../libs/core/templates/module-item.template.hbs";
import "./index.view.scss";

@RazorView()
class HomeView extends Layout {
    constructor() {
        super("home");
    }

    private _initLayout(): void {
        axios.get("/api/home/items?id=1").then(response => {
            if (response.data.status === EnumStatus.OK) {
                $(".management-list").append(Handlebars.compile(ModuleItemTemplate)(response.data.data));
            }
        });
    }

    onInit(): void {
        this._initLayout();
    }
}