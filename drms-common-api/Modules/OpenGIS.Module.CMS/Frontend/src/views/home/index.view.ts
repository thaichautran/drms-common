import axios from "axios";
import Handlebars from "handlebars";

import { RazorView } from "../../../../../libs/core/decorators/razor-view.decorator";
import { EnumStatus } from "../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../libs/core/helpers/utils";
import { Layout } from "../../../../../libs/core/layout";
import ModuleItemTemplate from "../../../../../libs/core/templates/module-item.template.hbs";
import "./index.view.scss";

@RazorView()
class HomeView extends Layout {
    constructor() {
        super("home");
    }

    onInit(): void {
        if (OGUtils.getUrlParams("id")) {
            axios.get("/api/home/items?id=" + OGUtils.getUrlParams("id")).then(response => {
                if (response.data.status === EnumStatus.OK) {
                    $(".management-list").append(Handlebars.compile(ModuleItemTemplate)(response.data.data));
                }
            });
        } else {
            axios.get("/api/home/items").then(response => {
                if (response.data.status === EnumStatus.OK) {
                    $(".management-list").append(Handlebars.compile(ModuleItemTemplate)(response.data.data));
                }
            });
        }
    }
}
