import { OGMap } from "@opengis/map";
import "jquery";
import "@mdi/font/css/materialdesignicons.css";
import "bootstrap";
import "devextreme/integration/jquery";
import "iconsax-font-icon/dist/icons.css";
import "iconsax-font-icon/fantasticonrc.js";
import "jquery";
type Handler<E> = (event: E) => void;

class EventDispatcher<E> {
    private handlers: Handler<E>[] = [];
    fire(event: E): void {
        for (const h of this.handlers) {
            h(event);
        }
    }
    register(handler: Handler<E>): void {
        this.handlers.push(handler);
    }
}

interface IMapComponent {
    oGMap: OGMap;
    onInit(): void;
}

interface IBaseComponent {
    onInit(): void;
}

export { EventDispatcher, Handler, IBaseComponent, IMapComponent };