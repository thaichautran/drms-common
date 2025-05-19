
import { OGMap } from "@opengis/map";
import dxForm from "devextreme/ui/form";
import dxPopup from "devextreme/ui/popup";
import { EventEmitter } from "events";
import jsPDF from "jspdf";

import { IMapComponent } from "../base-component.abstract";

class ExportMapComponent implements IMapComponent {
    editEmitter = new EventEmitter();
    exportForm: dxForm;

    oGMap: OGMap;
    popup: dxPopup;
    constructor(oGMap: OGMap) {
        this.oGMap = oGMap;
        this.onInit();
    }

    private _exportPDF(typeExport: string, format: string, resolution: number): void {
        let mapName = "map.pdf";
        if (typeExport === "1") {
            mapName = "map.pdf";
        } else if (typeExport === "2") {
            mapName = "map.png";
        }
        document.body.style.cursor = "progress";
        const g_Map = this.oGMap.olMap;
        const dims = {
            a0: [1189, 841],
            a1: [841, 594],
            a2: [594, 420],
            a3: [420, 297],
            a4: [297, 210],
            a5: [210, 148]
        };
        let loading = 0;
        let loaded = 0;
        const dim = dims[format];
        const width = Math.round(dim[0] * resolution / 25.4);
        const height = Math.round(dim[1] * resolution / 25.4);
        const size = (g_Map.getSize());
        const extent = g_Map.getView().calculateExtent(size);
        //var source = m_TempLayer.getSource();
        let timer;
        //var keys = [];
        function tileLoadEndFactory(canvas) {
            return function () {
                ++loaded;
                if (timer) {
                    clearTimeout(timer);
                    timer = null;
                }
                if (loading === loaded) {
                    timer = window.setTimeout(function () {
                        loading = 0;
                        loaded = 0;
                        const data = canvas.toDataURL("image/jpeg");
                        if (typeExport === "1") {
                            const pdf = new jsPDF("landscape", undefined, format);
                            pdf.addImage(data, "JPEG", 0, 0, dim[0], dim[1]);
                            pdf.save(mapName);
                        } else if (typeExport === "2") {
                            const link = document.createElement("a");
                            link.innerHTML = "download image";
                            link.addEventListener("click", function () {
                                link.href = data;
                                link.download = mapName;
                            }, false);
                            link.click();
                        }
                        //keys.forEach(unByKey);
                        //keys = [];
                        g_Map.setSize(size);
                        g_Map.getView().fit(extent, {
                            size
                        });
                        g_Map.renderSync();
                        //exportButton.disabled = false;
                        document.body.style.cursor = "auto";
                    }, 500);
                }
            };
        }

        g_Map.once("rendercomplete", function (event) {//postcompose
            const canvas = event.context.canvas;
            const tileLoadEnd = tileLoadEndFactory(canvas);
            //keys = [
            //    source.on('tileloadstart', tileLoadStart),
            //    source.on('tileloadend', tileLoadEnd),
            //    source.on('tileloaderror', tileLoadEnd)
            //];
            tileLoadEnd();
        });

        const printSize = [width, height];
        g_Map.setSize(printSize);
        loaded = -1;
        g_Map.renderSync();
    }

    public hide(): void {
        if (this.popup) {
            this.popup.hide();
        }
    }

    onInit(): void {
        this.popup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                container.addClass("popup-export-container");
                this.exportForm = $("<div />").appendTo(container).dxForm({
                    colCount: 1,
                    formData: {
                        formatFile: "autoCad",
                        overflowPadderEl: 72,
                        papersize: "a4",
                        tile: "a02",
                        typeExport: "1"
                    },
                    items: [
                        {
                            dataField: "typeExport",
                            editorOptions: {
                                dataSource: [{
                                    "id": "1",
                                    "text": "PDF"
                                }, {
                                    "id": "2",
                                    "text": "PNG"
                                }
                                ],
                                displayExpr: "text",
                                placeholder: "[Chọn...]",
                                valueExpr: "id",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Dạng"
                            }


                        },
                        {
                            dataField: "papersize",
                            editorOptions: {
                                dataSource: [{
                                    "id": "a0",
                                    "text": "Khổ A0"
                                }, {
                                    "id": "a1",
                                    "text": "Khổ A1"
                                },
                                {
                                    "id": "a2",
                                    "text": "Khổ A2"
                                },
                                {
                                    "id": "a3",
                                    "text": "Khổ A3"
                                },
                                {
                                    "id": "a4",
                                    "text": "Khổ A4"
                                },
                                {
                                    "id": "a5",
                                    "text": "Khổ A5"
                                }

                                ],
                                displayExpr: "text",
                                placeholder: "[Chọn...]",
                                valueExpr: "id",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Khổ giấy"
                            }


                        }, {
                            colSpan: 2,
                            dataField: "overflowPadderEl",
                            editorOptions: {
                                dataSource: [{
                                    "id": 72,
                                    "text": "72 DPI"
                                }, {
                                    "id": 150,
                                    "text": "150 DPI"
                                },
                                {
                                    "id": 300,
                                    "text": "300 DPI"
                                }

                                ],
                                displayExpr: "text",
                                placeholder: "[Chọn...]",
                                valueExpr: "id",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Độ phân giải"
                            },
                        }, {
                            colSpan: 2,
                            template: () => {
                                return "<hr style=\"margin: 5px 0;\" />";
                            }
                        }, {
                            buttonOptions: {
                                onClick: () => {
                                    const canvas = document.getElementById("map").getElementsByClassName("ol-unselectable")[0] as HTMLCanvasElement;
                                    canvas.toDataURL("image/png");
                                    this._exportPDF(this.exportForm.option("formData").typeExport, this.exportForm.option("formData").papersize, this.exportForm.option("formData").overflowPadderEl);

                                },
                                stylingMode: "contained",
                                text: "Xuất bản đồ",
                                type: "default"
                            },
                            colSpan: 2,
                            horizontalAlignment: "center",
                            itemType: "button"
                        }],
                    labelLocation: "top"

                }).dxForm("instance");
            },
            deferRendering: false,
            dragEnabled: true,
            height: "auto",
            hideOnOutsideClick: false,
            onHidden: () => {
                this.editEmitter.emit("hidden");
            },
            onOptionChanged: () => {

            },
            position: {
                at: "center",
                my: "center",
                of: window
            },
            resizeEnabled: false,

            shading: true,
            showTitle: true,
            title: "Lựa chọn xuất bản đồ",
            width: 400,
        }).dxPopup("instance");
    }

    public show(): void {
        if (this.popup) {
            this.popup.show();
        }
    }

}

export { ExportMapComponent };