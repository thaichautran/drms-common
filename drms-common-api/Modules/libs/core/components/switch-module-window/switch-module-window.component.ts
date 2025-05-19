import dxForm from "devextreme/ui/form";
import "devextreme/ui/form";
import dxPopup from "devextreme/ui/popup";
import "devextreme/ui/popup";

import { EnumStatus } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { IBaseComponent } from "../base-component.abstract";

class SwitchModuleWindowComponent implements IBaseComponent {
    colors: string[];
    dataSource: object[];
    form: dxForm;
    moduleName: string;
    popup: dxPopup;
    constructor(moduleName) {
        this.moduleName = moduleName;
        this.colors = ["#AB3333", "#E98B00", "#C7A614", "#028343", "#0B5CE3", "#0C3EBD", "#8904A0"];
        this.dataSource = [];
        this._getDataSource();
        this._eventPopup();
    }
    private _eventPopup(): void {
        const self = this;
        $(".btn-close-popup").on("click", function () {
            self.popup.hide();
        });
    }

    private _getDataSource(): void {
        // $.get("/api/homeItem/items?CurrentModules=" + this.moduleName).done(xhr => {
        //     if (xhr.status == EnumStatus.OK) {
        //         xhr.data.map(x => {
        //             this.dataSource.push({
        //                 icon: x.icon,
        //                 id: x.id,
        //                 url: x.url,
        //                 value: x.name,
        //             });
        //         });
        //     }
        // });
        $.get("/api/home/items?CurrentModules=" + this.moduleName).done(xhr => {
            if (xhr.status == EnumStatus.OK) {
                xhr.data.map(x => {
                    this.dataSource.push({
                        icon: x.icon,
                        id: x.id,
                        url: "/map?id=" + x.id,
                        value: x.name,
                    });
                });
                this.dataSource.push({
                    icon: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgaWQ9IkxheWVyXzEiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDEyOCAxMjg7IiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAxMjggMTI4IiB4bWw6c3BhY2U9InByZXNlcnZlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48c3R5bGUgdHlwZT0idGV4dC9jc3MiPgoJLnN0MHtmaWxsLXJ1bGU6ZXZlbm9kZDtjbGlwLXJ1bGU6ZXZlbm9kZDt9Cgkuc3Qxe2ZpbGwtcnVsZTpldmVub2RkO2NsaXAtcnVsZTpldmVub2RkO2ZpbGw6IzdBQ0VENzt9Cjwvc3R5bGU+PGcgaWQ9IlhNTElEXzZfIj48cGF0aCBjbGFzcz0ic3QwIiBkPSJNMTE5LjIsOTkuM2wtMTkuOSwxOS45Yy0yLjMsMi4zLTYuMSwyLjMtOC40LDBsLTYuOS02Ljl2OS44YzAsMy4zLTIuNyw1LjktNS45LDUuOUg0OS45ICAgYy0zLjMsMC01LjktMi43LTUuOS01Ljl2LTkuOGwtNi45LDYuOWMtMi4zLDIuMy02LjEsMi4zLTguNCwwTDguOCw5OS4zYy0yLjMtMi4zLTIuMy02LjEsMC04LjRsNi45LTYuOUg1LjlDMi43LDg0LDAsODEuMywwLDc4LjEgICBWNDkuOUMwLDQ2LjcsMi43LDQ0LDUuOSw0NGg5LjhsLTYuOS02LjljLTIuMy0yLjMtMi4zLTYuMSwwLTguNEwyOC43LDguOGMyLjMtMi4zLDYuMS0yLjMsOC40LDBsNi45LDYuOVY1LjlDNDQsMi43LDQ2LjcsMCw0OS45LDAgICBoMjguMUM4MS4zLDAsODQsMi43LDg0LDUuOXY5LjhsNi45LTYuOWMyLjMtMi4zLDYuMS0yLjMsOC40LDBsMTkuOSwxOS45YzIuMywyLjMsMi4zLDYuMSwwLDguNGwtNi45LDYuOWg5LjggICBjMy4zLDAsNS45LDIuNyw1LjksNS45djI4LjFjMCwzLjMtMi43LDUuOS01LjksNS45aC05LjhsNi45LDYuOUMxMjEuNSw5My4yLDEyMS41LDk3LDExOS4yLDk5LjNMMTE5LjIsOTkuM3ogTTY0LDQzLjEgICBjLTExLjYsMC0yMC45LDkuNC0yMC45LDIwLjljMCwxMS42LDkuNCwyMC45LDIwLjksMjAuOWMxMS42LDAsMjAuOS05LjQsMjAuOS0yMC45Qzg0LjksNTIuNCw3NS42LDQzLjEsNjQsNDMuMXoiIGlkPSJYTUxJRF8xMF8iLz48cGF0aCBjbGFzcz0ic3QxIiBkPSJNNjQsMzkuMWMxMy44LDAsMjQuOSwxMS4yLDI0LjksMjQuOWMwLDEzLjgtMTEuMiwyNC45LTI0LjksMjQuOWMtMTMuOCwwLTI0LjktMTEuMi0yNC45LTI0LjkgICBDMzkuMSw1MC4yLDUwLjIsMzkuMSw2NCwzOS4xTDY0LDM5LjF6IE05Ni41LDExLjZjLTAuOC0wLjgtMi0wLjgtMi43LDBMODAsMjUuNFY1LjlDODAsNC45LDc5LjEsNCw3OC4xLDRINDkuOSAgIEM0OC45LDQsNDgsNC45LDQ4LDUuOXYxOS40TDM0LjMsMTEuNmMtMC44LTAuOC0yLTAuOC0yLjcsMEwxMS42LDMxLjVjLTAuOCwwLjgtMC44LDIsMCwyLjdMMjUuNCw0OEg1LjlDNC45LDQ4LDQsNDguOSw0LDQ5Ljl2MjguMSAgIEM0LDc5LjEsNC45LDgwLDUuOSw4MGgxOS40TDExLjYsOTMuN2MtMC44LDAuOC0wLjgsMiwwLDIuN2wxOS45LDE5LjljMC44LDAuOCwyLDAuOCwyLjcsMEw0OCwxMDIuNnYxOS40YzAsMS4xLDAuOSwxLjksMS45LDEuOSAgIGgyOC4xYzEuMSwwLDEuOS0wLjksMS45LTEuOXYtMTkuNGwxMy43LDEzLjdjMC44LDAuOCwyLDAuOCwyLjcsMGwxOS45LTE5LjljMC44LTAuOCwwLjgtMiwwLTIuN0wxMDIuNiw4MGgxOS40ICAgYzEuMSwwLDEuOS0wLjksMS45LTEuOVY0OS45YzAtMS4xLTAuOS0xLjktMS45LTEuOWgtMTkuNGwxMy43LTEzLjdjMC44LTAuOCwwLjgtMiwwLTIuN0w5Ni41LDExLjZ6IiBpZD0iWE1MSURfN18iLz48L2c+PC9zdmc+",
                    id: 0,
                    url: "/system",
                    value: "Quản trị",
                });
            }
        });
    }

    private _initPopup(): void {
        const self = this;
        self.popup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (element) => {
                this.form = $("<div />").appendTo(element).dxForm({
                    colCount: 2,
                    formData: {
                    },
                    items: [],
                    width: "100%",
                }).dxForm("instance");
                //let row = $('<div class="row" style="justify-content: center; margin-top: 10px;" />').appendTo(element);
                //$('<div />').appendTo(row).dxButton({
                //    text: "Xác nhận",
                //    stylingMode: "contained",
                //    width: 75,
                //    onClick: () => {
                //        window.location.href = formPopup.getEditor('module_id').option('selectedItem').url;
                //    },
                //    visible: true,
                //    type: "default",
                //}).dxButton('instance');
                //$('<div style="margin-left:5px;"/>').appendTo(row).dxButton({
                //    text: 'Hủy bỏ',
                //    styleMode: "success",
                //    width: 75,
                //    onClick: () => {
                //        self.popup.hide();
                //    }
                //});
            },
            deferRendering: false,
            dragEnabled: true,
            height: "auto",
            //title: "Chuyển nhanh module",
            hideOnOutsideClick: false,
            onHidden: () => {
            },
            onShown: () => {
            },
            position: "center",
            shading: false,
            showTitle: true,
            titleTemplate: function () {
                return `<div class="">
                            <div class='text-center p-2' style='font-size: 18px; font-style:normal; font-weight: 400; postion: relative'>Chuyển nhanh module</div>
                            <div class="dx-toolbar-after dx-toolbar-button btn-close-popup" style='position: absolute; top: 10px; right: 10px; cursor: pointer;'><i class="dx-icon dx-icon-close" style='font-size: 20px'></i></div>
                        </div>`;
            },
            //showCloseButton: true,
            visible: false,
            width: "40%",
            wrapperAttr: {
                class: "popup-switch-module",
            },

        }).dxPopup("instance");
    }
    onInit(): void {
        this._initPopup();
    }

    public showPopup(): void {
        const items = [];
        let i = 0;
        this.form.beginUpdate();
        this.dataSource.forEach(item => {
            items.push({
                buttonOptions: {
                    //height: '40px',
                    elementAttr: {
                        class: "rounded-9 text-light",
                        style: "background-color: " + OGUtils.rainbow(this.dataSource.length, i) + "!important; width: 100%; text-align: left;"
                    },
                    hint: item["value"],
                    icon: item["icon"],
                    onClick: function () {
                        window.location.href = item["url"];
                    },
                    text: item["value"],
                    width: "100%"
                },
                itemType: "button"
            });
            i++;
            this.form.option("items", items);
            this.form.endUpdate();
            this.popup.show();
        });
    }
}

export { SwitchModuleWindowComponent };