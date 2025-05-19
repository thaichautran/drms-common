import { RazorView } from "../../../../../../libs/core/decorators/razor-view.decorator";
import { Layout } from "../../../../../../libs/core/layout";
import { UserAccessView } from "./user-access/user-access.view";
import { UserDistricView } from "./user-district/user_district.view";
import { UserGroupView } from "./user-group/user-group.view";

@RazorView()
class HomeView extends Layout {
    userAccessContainer: JQuery<HTMLElement>;
    userAccessView: UserAccessView;
    userDistrictContainer: JQuery<HTMLElement>;
    userDistrictView: UserDistricView;
    userGroupContainer: JQuery<HTMLElement>;
    userGroupView: UserGroupView;

    constructor() {
        super("child", "Thông tin chung hệ thống");
    }

    onInit(): void {
        $(".tab-item-container").css({
            "background-color": "white"
        }).height(window.innerHeight - $("header").outerHeight());
        
        this.userDistrictContainer = $("#user-district-container");
        this.userGroupContainer = $("#user-group-container");
        this.userAccessContainer = $("#user-access-container");
        this.userDistrictView = new UserDistricView(this.userDistrictContainer);
        this.userGroupView = new UserGroupView(this.userGroupContainer);
        this.userAccessView = new UserAccessView(this.userAccessContainer);
    }
}