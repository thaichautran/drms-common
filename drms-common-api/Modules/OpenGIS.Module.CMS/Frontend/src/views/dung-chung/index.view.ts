import axios from "axios";
import Handlebars from "handlebars";

import { RazorView } from "../../../../../libs/core/decorators/razor-view.decorator";
import { EnumDanhMucNhomBanDo, EnumStatus } from "../../../../../libs/core/enums/enums";
import { Layout } from "../../../../../libs/core/layout";
import ModuleItemTemplate from "../../../../../libs/core/templates/module-item.template.hbs";

@RazorView()
class HoSoGoiThauView extends Layout {
    constructor() {
        super("child", "Phân hệ dùng chung");
    }
    private _initLayout(): void {
        axios.get("/api/home/items?id=" + EnumDanhMucNhomBanDo.DUNG_CHUNG.id).then(response => {
            if (response.data.status === EnumStatus.OK) {
                $(".management-list").append(Handlebars.compile(ModuleItemTemplate)(response.data.data));
            }
        });
    }
    onInit(): void {
        this._initLayout();
    }
}