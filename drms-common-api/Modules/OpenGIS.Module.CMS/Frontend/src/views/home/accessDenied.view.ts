

import { RazorView } from "../../../../../libs/core/decorators/razor-view.decorator";
import { Layout } from "../../../../../libs/core/layout";
import "./index.view.scss";

@RazorView()
export default class AccessDeniedView extends Layout {
    constructor() {
        super("top");
    }
    onInit(): void {
        
    }
}
