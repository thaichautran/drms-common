import "devextreme/ui/check_box";
import "devextreme/ui/color_box";
import "devextreme/ui/number_box";
import DropZone from "dropzone/dist/dropzone";
import "dropzone/dist/dropzone.css";
import {
    Circle,
    Fill,
    Icon,
    RegularShape,
    Stroke,
    Style,
    Text
} from "ol/style";

const SHAPE_TYPE = {
    CIRCLE: "circle",
    CROSS: "cross",
    SQUARE: "square",
    STAR: "star",
    TRIANGLE: "triangle",
    X: "x"
};
import { OGMapUtils } from "@opengis/map";
import dxDataGrid from "devextreme/ui/data_grid";
import dxForm from "devextreme/ui/form";
import dxMultiView from "devextreme/ui/multi_view";
import dxPopup from "devextreme/ui/popup";
import dxTabPanel from "devextreme/ui/tab_panel";
import { EventEmitter } from "events";
import { FillSymbolizer, Style as GeoStylerStyle, IconSymbolizer, LineSymbolizer, MarkSymbolizer, Symbolizer, isIconSymbolizer, isSprite } from "geostyler-style";
import { LineString, Point, Polygon } from "ol/geom";
import { toContext } from "ol/render";
import CircleStyle from "ol/style/Circle";

import { EnumGeometry, EnumStatus } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { RestError } from "../../models/base-response.model";
import { OGLayerModel } from "../../models/layer.model";
import { LayerService } from "../../services/layer.service";
import { IBaseComponent } from "../base-component.abstract";
import "./style-editor.component.scss";

interface StyleResolveOption {
    geoStyler?: object,
    sld?: object,
    type: string,
}

class StyleEditorComponent implements IBaseComponent {
    private deffered: JQueryDeferred<StyleResolveOption>;
    private dropZone: DropZone;
    private dropZoneForm: JQuery<HTMLElement>;
    private dzId: string;
    private eventEmitter = new EventEmitter();
    private geoStylerSymbolizer: Symbolizer;
    private iconForm: dxForm;
    private imageForm: dxForm;
    private labelForm: dxForm;
    private layerGrid: dxDataGrid;
    private lineStringCanvas: JQuery<HTMLElement>;
    private lineStringForm: dxForm;
    private oGLayer: OGLayerModel;
    private pointCanvas: JQuery<HTMLElement>;
    private pointForm: dxForm;
    private pointFormViews: dxMultiView;
    private polygonCanvas: JQuery<HTMLElement>;
    private polygonForm: dxForm;
    private popup: dxPopup;
    private promise: Promise<boolean>;
    private rootView: dxMultiView;
    private tab: dxTabPanel;
    private textCanvasContainer: JQuery<HTMLElement>;
    private textPreviewCanvas: JQuery<HTMLElement>;
    private viewIconContainer: JQuery<HTMLElement>;
    constructor() {
        this.onInit();
    }
    //Vẽ biểu tượng dạng đường xem trước
    private _drawLineStringCanvas(): void {
        if (this.lineStringForm) {
            const lsData = this.lineStringForm.option("formData");
            let stroke;
            if (lsData.dashWidth) {
                stroke = new Stroke({
                    color: lsData.strokeColor,
                    lineCap: "round",
                    lineDash: lsData.dashWidth > 0 ? [lsData.dashWidth, lsData.dashWidth] : [1, 1],
                    width: lsData.strokeWidth,
                });
            } else {
                stroke = new Stroke({
                    color: lsData.strokeColor,
                    lineCap: "round",
                    width: lsData.strokeWidth,
                });
            }
            const style = new Style({
                stroke: stroke,
            });

            OGMapUtils.olStyleToCanvas(style, 48, this.lineStringCanvas.get(0) as HTMLCanvasElement);
            OGMapUtils.olStyleToGeoStylerStyle(style).then(geoStyler => {
                this.lineStringForm.option("formData").data = geoStyler;
            });
        }
    }

    //Vẽ biểu tượng dạng điểm xem trước
    private _drawPointCanvas(): void {
        const masterData = this.pointForm.option("formData");
        if (this.pointFormViews.option("selectedIndex") === 0) {
            //Biểu tượng 
            const iconData = this.iconForm.option("formData");
            let style: Style;
            const stroke = new Stroke({
                color: iconData.strokeColor,
                width: iconData.strokeWidth,
            });
            const fill = new Fill({
                color: iconData.fillColor,
            });
            switch (iconData.shape) {
                case SHAPE_TYPE.CIRCLE:
                    style = new Style({
                        image: new CircleStyle({
                            fill: fill,
                            radius: masterData.size,
                            stroke: stroke
                        })
                    });
                    break;
                case SHAPE_TYPE.SQUARE:
                    style = new Style({
                        image: new RegularShape({
                            angle: Math.PI / 4,
                            fill: fill,
                            points: 4,
                            radius: masterData.size,
                            stroke: stroke
                        })
                    });
                    break;
                case SHAPE_TYPE.TRIANGLE:
                    style = new Style({
                        image: new RegularShape({
                            angle: 0,
                            fill: fill,
                            points: 3,
                            radius: masterData.size,
                            rotation: 0, // Math.PI / 4,
                            stroke: stroke
                        })
                    });
                    break;
                case SHAPE_TYPE.STAR:
                    style = new Style({
                        image: new RegularShape({
                            angle: 0,
                            fill: fill,
                            points: 5,
                            radius: masterData.size,
                            radius2: masterData.size * 0.4,
                            stroke: stroke
                        })
                    });
                    break;
                case SHAPE_TYPE.CROSS:
                    style = new Style({
                        image: new RegularShape({
                            angle: 0,
                            fill: fill,
                            points: 4,
                            radius: masterData.size,
                            radius2: 0,
                            stroke: stroke
                        })
                    });
                    break;
                case SHAPE_TYPE.X:
                    style = new Style({
                        image: new RegularShape({
                            angle: Math.PI / 4,
                            fill: fill,
                            points: 4,
                            radius: masterData.size,
                            radius2: 0,
                            stroke: stroke
                        })
                    });
                    break;
                default:
                    return;
            }

            OGMapUtils.olStyleToCanvas(style, masterData.size, this.pointCanvas.get(0) as HTMLCanvasElement);
            OGMapUtils.olStyleToGeoStylerStyle(style).then(geoStyler => {
                this.iconForm.option("formData").data = geoStyler;
            });
        } else if (this.pointFormViews.option("selectedIndex") === 1) {
            //Hình ảnh
            const imageData = this.imageForm.option("formData");
            const files = this.dropZone.files;
            if (files && files.length > 0) {
                new Promise((resolve) => {
                    const img = new Image();
                    if (files[0].dataURL) {
                        img.src = files[0].dataURL;
                        resolve(img);
                    } else {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            // if (e.target.result instanceof String){
                            //     img.src = e.target.result.toString();
                            // }
                            if (typeof (e.target.result) == "string") {
                                img.src = e.target.result.toString();
                            }
                            img.onload = () => {
                                resolve(img);
                            };
                        };
                        reader.readAsDataURL(files[0]);
                    }
                }).then((img: HTMLImageElement) => {
                    const style = new Style({
                        image: new Icon({
                            anchor: [imageData.offsetX, imageData.offsetY],
                            img: img,
                            scale: masterData.size / img.height,
                            size: [img.naturalWidth, img.naturalHeight]
                        })
                    });
                    OGMapUtils.olStyleToCanvas(style, masterData.size, this.pointCanvas.get(0) as HTMLCanvasElement);
                    OGMapUtils.olStyleToGeoStylerStyle(style).then(geoStyler => {
                        this.imageForm.option("formData").data = geoStyler;
                    });
                });
            } else if (imageData.image) {
                new Promise((resolve) => {
                    const img = new Image();
                    if (isSprite(imageData.image)) {
                        img.src = imageData.image.source;
                    }
                    else {
                        img.src = imageData.image;
                    }
                    resolve(img);
                }).then((img: HTMLImageElement) => {
                    const style = new Style({
                        image: new Icon({
                            anchor: [imageData.offsetX, imageData.offsetY],
                            img: img,
                            scale: masterData.size / img.height,
                            size: [img.naturalWidth, img.naturalHeight],
                        })
                    });

                    OGMapUtils.olStyleToCanvas(style, masterData.size, this.pointCanvas.get(0) as HTMLCanvasElement);
                    OGMapUtils.olStyleToGeoStylerStyle(style).then(geoStyler => {
                        this.imageForm.option("formData").data = geoStyler;
                    });
                });
            }
        }
    }
    //Vẽ biểu tượng dạng vùng xem trước
    private _drawPolygonCanvas(): void {
        const lsData = this.polygonForm.option("formData");
        const stroke = new Stroke({
            color: lsData.strokeColor,
            width: lsData.strokeWidth,
        });
        const fill = new Fill({
            color: lsData.fillColor,
        });
        const style = new Style({
            fill: fill,
            stroke: stroke
        });
        //
        OGMapUtils.olStyleToCanvas(style, 48, this.polygonCanvas.get(0) as HTMLCanvasElement);
        OGMapUtils.olStyleToGeoStylerStyle(style).then(geoStyler => {
            this.polygonForm.option("formData").data = geoStyler;
        });
    }

    //Vẽ label xem trước
    private _drawTextCanvas(): void {
        const textConfig = this.labelForm.option("formData");
        const text = new Text({
            fill: new Fill({ color: textConfig.textColor }),
            font: textConfig.textSize + "px " + textConfig.font + ",sans-serif",
            offsetX: textConfig.offsetX,
            offsetY: textConfig.offsetY,
            overflow: true,
            placement: textConfig.placement || "point",
            stroke: new Stroke({
                color: textConfig.strokeColor,
                width: textConfig.strokeWidth
            }),
            text: "Xem trước",
            textAlign: textConfig.align || "center",
            textBaseline: textConfig.baseline || "middle",
        });
        let style = new Style({
            image: new Circle({
                fill: new Fill({ color: "#666666" }),
                radius: 5,
                stroke: new Stroke({ color: "#bada55", width: 1 })
            }),
            text: text
        });
        if (this.oGLayer) {
            if (this.oGLayer.geometry === EnumGeometry.Point || this.oGLayer.geometry === EnumGeometry.MultiPoint) {
                style = new Style({
                    image: new Circle({
                        fill: new Fill({ color: "#666666" }),
                        radius: 5,
                        stroke: new Stroke({ color: "#bada55", width: 1 })
                    }),
                    text: text
                });
            } else if (this.oGLayer.geometry === EnumGeometry.LineString || this.oGLayer.geometry === EnumGeometry.MultiLineString) {
                style = new Style({
                    stroke: new Stroke({
                        color: "red",
                        width: 2,
                    }),
                    text: text
                });
            } else if (this.oGLayer.geometry === EnumGeometry.Polygon || this.oGLayer.geometry === EnumGeometry.MultiPolygon) {
                style = new Style({
                    fill: new Fill({
                        color: "rgba(255, 0, 0, 0.5)",
                    }),
                    text: text
                });
            }
        }
        this.textStyleToCanvas(style, this.textPreviewCanvas.get(0) as HTMLCanvasElement);
        OGMapUtils.olStyleToGeoStylerStyle(style).then(geoStyler => {
            this.labelForm.option("formData").data = geoStyler;
        });
    }

    // Xây dựng form chỉnh style hiển thị label
    private _initLabelEditor(container): void {
        this.labelForm = $("<div />").appendTo(container).dxForm({
            formData: {
                align: "center",
                baseline: "middle",
                font: "Reddit Sans",
                offsetX: 0,
                offsetY: 0,
                placement: "point",
                strokeColor: "#000000",
                strokeWidth: 2,
                textColor: "#FFFFFF",
                textSize: 12
            },
            items: [{
                dataField: "is_label_visible",
                editorType: "dxCheckBox",
                label: {
                    text: "Hiển thị label"
                }
            }, {
                colCount: 3,
                itemType: "group",
                items: [{
                    dataField: "textColor",
                    editorOptions: {
                        onValueChanged: () => {
                            this._drawTextCanvas();
                        }
                    },
                    editorType: "dxColorBox",
                    label: {
                        text: "Màu chữ"
                    },
                }, {
                    dataField: "textSize",
                    editorOptions: {
                        mode: "number",
                        onValueChanged: () => {
                            this._drawTextCanvas();
                        },
                        showSpinButtons: true,
                        visible: true
                    },
                    editorType: "dxNumberBox",
                    label: {
                        text: "Kích cỡ"
                    },
                }, {
                    dataField: "font",
                    editorOptions: {
                        dataSource: ["Arial", "Tahoma", "Reddit Sans", "Segoe UI", "Verdana", "Times New Roman"],
                        onValueChanged: () => {
                            this._drawTextCanvas();
                        }
                    },
                    editorType: "dxSelectBox",
                    label: {
                        text: "Kiểu font"
                    }
                }, {
                    dataField: "strokeColor",
                    editorOptions: {
                        onValueChanged: () => {
                            this._drawTextCanvas();
                        }
                    },
                    editorType: "dxColorBox",
                    label: {
                        text: "Màu viền"
                    },
                }, {
                    dataField: "strokeWidth",
                    editorOptions: {
                        mode: "number",
                        onValueChanged: () => {
                            this._drawTextCanvas();
                        },
                        showSpinButtons: true,
                        visible: true
                    },
                    editorType: "dxNumberBox",
                    label: {
                        text: "Kích cỡ viền"
                    },
                }, {
                    dataField: "align",
                    editorOptions: {
                        dataSource: [{
                            code: "",
                            value: "Không căn lề"
                        }, {
                            code: "start",
                            value: "Bắt đầu"
                        }, {
                            code: "end",
                            value: "Kết thúc"
                        }, {
                            code: "left",
                            value: "Trái"
                        }, {
                            code: "right",
                            value: "Phải"
                        }, {
                            code: "center",
                            value: "Căn giữa"
                        }],
                        displayExpr: "value",
                        onValueChanged: () => {
                            this._drawTextCanvas();
                        },
                        valueExpr: "code"
                    },
                    editorType: "dxSelectBox",
                    label: {
                        text: "Căn lề"
                    },
                }, {
                    dataField: "placement",
                    editorOptions: {
                        dataSource: [{
                            code: "point",
                            value: "Kiểu điểm"
                        }, {
                            code: "line",
                            value: "Kiểu đường"
                        }],
                        displayExpr: "value",
                        onValueChanged: () => {
                            this._drawTextCanvas();
                        },
                        valueExpr: "code"
                    },
                    editorType: "dxSelectBox",
                    label: {
                        text: "Kiểu đặt label"
                    },
                }, {
                    dataField: "baseline",
                    editorOptions: {
                        dataSource: [{
                            code: "alphabetic",
                            value: "Alphabetic"
                        }, {
                            code: "bottom",
                            value: "Bottom"
                        }, {
                            code: "hanging",
                            value: "Hanging"
                        }, {
                            code: "ideographic",
                            value: "Ideographic"
                        }, {
                            code: "middle",
                            value: "Middle"
                        }, {
                            code: "top",
                            value: "Top"
                        }],
                        displayExpr: "value",
                        onValueChanged: () => {
                            this._drawTextCanvas();
                        },
                        valueExpr: "code"
                    },
                    editorType: "dxSelectBox",
                    label: {
                        text: "Baseline"
                    },
                }, {
                    dataField: "offsetX",
                    editorOptions: {
                        mode: "number",
                        onValueChanged: () => {
                            this._drawTextCanvas();
                        },
                        showSpinButtons: true,
                        visible: true
                    },
                    editorType: "dxNumberBox",
                    label: {
                        text: "Sai trục X"
                    },
                }, {
                    dataField: "offsetY",
                    editorOptions: {
                        mode: "number",
                        onValueChanged: () => {
                            this._drawTextCanvas();
                        },
                        showSpinButtons: true,
                        visible: true
                    },
                    editorType: "dxNumberBox",
                    label: {
                        text: "Sai trục Y"
                    },
                }]
            }, {
                template: (itemData, itemElement) => {
                    const textCanvasContainer = $("<div />").width("100%").height("auto").css("display", "flex").css("align-items", "center").appendTo(itemElement);
                    this.textPreviewCanvas = $("<canvas />").css("margin", "auto").css("height", "50px").appendTo(textCanvasContainer);
                }
            }, {
                template: () => {
                    return "<hr style=\"margin: 5px 0;\" />";
                }
            }, {
                buttonOptions: {
                    onClick: () => {
                        const style = this.labelForm.option("formData").data;
                        if (this.deffered) {
                            this.deffered.resolve({
                                geoStyler: style,
                                type: "label",
                            });
                            this.hide();
                        } else {
                            const is_label_visible = this.labelForm.option("formData").is_label_visible;
                            LayerService.setLabelStyle(this.oGLayer.id, JSON.stringify(style), is_label_visible).then(result => {
                                if (result.status === EnumStatus.OK) {
                                    OGUtils.toastSuccess("Lưu thiết lập thành công!");
                                    this.hide();
                                }
                            });
                        }
                    },
                    stylingMode: "contained",
                    text: "Lưu thiết lập label",
                    type: "default"
                },
                colSpan: 2,
                horizontalAlignment: "center",
                itemType: "button"
            }],
            labelLocation: "top"
        }).dxForm("instance");
        //
        this._drawTextCanvas();
    }

    // Form biểu tượng dạng đường
    private _initLineStringForm(container): void {
        this.lineStringForm = $("<div />").appendTo(container).dxForm({
            colCount: 2,
            formData: {
                "dashWidth": 5,
                "opacity": 1.0,
                "strokeColor": "#000000",
                "strokeWidth": 1,
            },
            items: [{
                dataField: "strokeWidth",
                editorOptions: {

                    mode: "number",
                    onValueChanged: () => {
                        this._drawLineStringCanvas();
                    },
                    showSpinButtons: true,
                    visible: true
                },
                editorType: "dxNumberBox",
                label: {
                    text: "Độ rộng viền"
                },
            }, {
                dataField: "strokeColor",
                editorOptions: {
                    editAlphaChannel: true,

                    onValueChanged: () => {
                        this._drawLineStringCanvas();
                    }
                },
                editorType: "dxColorBox",
                label: {
                    text: "Màu viền"
                }
            }, {
                dataField: "dashWidth",
                editorOptions: {

                    mode: "number",
                    onValueChanged: () => {
                        this._drawLineStringCanvas();
                    },
                    showSpinButtons: true,
                    step: 1
                },
                editorType: "dxNumberBox",
                label: {
                    text: "Kiểu đường"
                }
            }, {
                dataField: "opacity",
                editorOptions: {

                    onValueChanged: () => {
                        this._drawLineStringCanvas();
                    },
                    showSpinButtons: true,
                    step: 0.1
                },
                editorType: "dxNumberBox",

                label: {
                    text: "Độ mờ"
                }
            }, {
                colSpan: 2,
                template: (itemData, itemElement) => {
                    const lineStringCanvasContainer: JQuery<HTMLElement> = $("<div />").width("100%").css("display", "flex").css("align-items", "center").appendTo(itemElement);
                    this.lineStringCanvas = $("<canvas />").css("margin", "auto").appendTo(lineStringCanvasContainer);
                }
            }, {
                colSpan: 2,
                template: () => {
                    return "<hr style=\"margin: 5px 0;\" />";
                }
            }, {
                buttonOptions: {
                    onClick: () => {
                        const style = this.lineStringForm.option("formData").data;
                        if (this.deffered) {
                            this.deffered.resolve({
                                geoStyler: style,
                                type: "style",
                            });
                            this.hide();
                        } else {
                            LayerService.setStyle(this.oGLayer.id, JSON.stringify(style)).then(result => {
                                if (result.status === EnumStatus.OK) {
                                    OGUtils.toastSuccess("Lưu thiết lập thành công!");
                                    this.refreshLayerGrid();
                                    this.hide();
                                } else {
                                    OGUtils.toastError(result as RestError);
                                }
                            });
                        }
                    },
                    stylingMode: "contained",
                    text: "Lưu thiết lập",
                    type: "default"
                },
                colSpan: 2,
                horizontalAlignment: "center",
                itemType: "button"
            }],
            labelLocation: "top",
            onInitialized: function () {

            }
        }).dxForm("instance");

        this._drawLineStringCanvas();
    }

    // Form biểu tượng dạng điểm
    private _initPointForm(container): void {
        this.pointForm = $("<div />").appendTo(container).dxForm({
            colCount: 2,
            formData: {
                size: 24,
                type: 0,
            },
            items: [{
                dataField: "type",
                editorOptions: {
                    displayExpr: "name",

                    items: [{
                        id: 0,
                        name: "Biểu tượng"
                    }, {
                        id: 1,
                        name: "Hình ảnh"
                    }],
                    onSelectionChanged: (e) => {
                        if (this.pointFormViews) {
                            this.pointFormViews.option("selectedIndex", e.component.option("value"));
                        }
                    },
                    valueExpr: "id"
                },
                editorType: "dxSelectBox",
                label: {
                    text: "Kiểu"
                }
            }, {
                dataField: "size",
                editorOptions: {
                    mode: "number",
                    onValueChanged: () => {
                        this._drawPointCanvas();
                    },
                    showSpinButtons: true,
                    visible: true
                },
                editorType: "dxNumberBox",
                label: {
                    text: "Kích thước"
                },
            }, {
                colSpan: 2,
                template: () => {
                    return "<hr style=\"margin: 5px 0;\" />";
                }
            }, {
                colSpan: 2,
                template: (e, container) => {
                    //Form thông tin chi tiết theo loại biểu tượng
                    $("<div />").appendTo(container)
                        .dxResponsiveBox({
                            cols: [{
                                ratio: 0.5
                            }, {
                                ratio: 0.5
                            }],
                            itemTemplate: (itemData, itemIndex, itemElement) => {
                                if (itemIndex === 0) {
                                    this.pointFormViews = $("<div />").appendTo(itemElement)
                                        .dxMultiView({
                                            animationEnabled: false,
                                            deferRendering: false,
                                            itemTemplate: (itemData, itemIndex, itemElement) => {
                                                if (itemData.id === "icon") {
                                                    this.viewIconContainer = $("<div />").appendTo(itemElement);
                                                    this.iconForm = this.viewIconContainer.dxForm({
                                                        colCount: 2,
                                                        formData: {
                                                            "fillColor": "#000000",
                                                            "shape": SHAPE_TYPE.SQUARE,
                                                            "strokeColor": "#000000",
                                                            "strokeWidth": 0,
                                                        },
                                                        items: [{
                                                            dataField: "shape",
                                                            editorOptions: {
                                                                displayExpr: "name",
                                                                items: [{
                                                                    ID: SHAPE_TYPE.CIRCLE,
                                                                    name: "Hình tròn"
                                                                }, {
                                                                    ID: SHAPE_TYPE.SQUARE,
                                                                    name: "Hình vuông"
                                                                }, {
                                                                    ID: SHAPE_TYPE.TRIANGLE,
                                                                    name: "Hình tam giác"
                                                                }, {
                                                                    ID: SHAPE_TYPE.STAR,
                                                                    name: "Hình sao"
                                                                }, {
                                                                    ID: SHAPE_TYPE.CROSS,
                                                                    name: "Hình chữ thập"
                                                                }, {
                                                                    ID: SHAPE_TYPE.X,
                                                                    name: "Hình dấu X"
                                                                }],
                                                                onValueChanged: () => {
                                                                    this._drawPointCanvas();
                                                                },
                                                                placeholder: "Chọn hình dạng",
                                                                valueExpr: "ID"
                                                            },
                                                            editorType: "dxSelectBox",
                                                            label: {
                                                                text: "Hình dạng"
                                                            }
                                                        }, {
                                                            dataField: "fillColor",
                                                            editorOptions: {
                                                                onValueChanged: () => {
                                                                    this._drawPointCanvas();
                                                                }
                                                            },
                                                            editorType: "dxColorBox",
                                                            label: {
                                                                text: "Màu nền"
                                                            },
                                                        }, {
                                                            dataField: "strokeWidth",
                                                            editorOptions: {
                                                                mode: "number",
                                                                onValueChanged: () => {
                                                                    this._drawPointCanvas();
                                                                },
                                                                showSpinButtons: true,
                                                                visible: true
                                                            },
                                                            editorType: "dxNumberBox",
                                                            label: {
                                                                text: "Độ rộng viền"
                                                            },
                                                        }, {
                                                            dataField: "strokeColor",
                                                            editorOptions: {
                                                                onValueChanged: () => {
                                                                    this._drawPointCanvas();
                                                                }
                                                            },
                                                            editorType: "dxColorBox",
                                                            label: {
                                                                text: "Màu viền"
                                                            }
                                                        }],
                                                        labelLocation: "top",
                                                        onInitialized: function () {

                                                        }
                                                    }).dxForm("instance");
                                                } else if (itemData.id === "image") {
                                                    this.imageForm = $("<div />").appendTo(itemElement).dxForm({
                                                        colCount: 2,
                                                        formData: {
                                                            offsetX: 0.5,
                                                            offsetY: 0.5
                                                        },
                                                        items: [{
                                                            dataField: "offsetX",
                                                            editorOptions: {
                                                                mode: "number",
                                                                onValueChanged: () => {
                                                                    this._drawPointCanvas();
                                                                },
                                                                showSpinButtons: true,
                                                                step: 0.1,
                                                                visible: true
                                                            },
                                                            editorType: "dxNumberBox",
                                                            label: {
                                                                location: "top",
                                                                text: "Sai trục X"
                                                            },
                                                        }, {
                                                            dataField: "offsetY",
                                                            editorOptions: {
                                                                mode: "number",
                                                                onValueChanged: () => {
                                                                    this._drawPointCanvas();
                                                                },
                                                                showSpinButtons: true,
                                                                step: 0.1,
                                                                visible: true
                                                            },
                                                            editorType: "dxNumberBox",
                                                            label: {
                                                                location: "top",
                                                                text: "Sai trục Y"
                                                            },
                                                        }, {
                                                            colSpan: 2,
                                                            template: (e, container) => {
                                                                if (!this.dropZoneForm && !this.dropZone) {
                                                                    this.dzId = "t" + OGUtils.uuidv4() + "_dropzone";
                                                                    //Vùng upload ảnh đối với biểu tượng điểm dạng ảnh
                                                                    this.dropZoneForm = $("<form action=\"#\" class=\"dropzone needsclick\" id=\"" + this.dzId + "\"><div class=\"dz-message needsclick\">Kéo tệp vào đây hoặc nhấn để upload.<br /></div></form>")
                                                                        .css("min-height", (this.viewIconContainer.height() - 40 - 4).toString() + "px !important")
                                                                        .appendTo("<div style=\"width:100%\" />")
                                                                        .appendTo(container);
                                                                    this.dropZone = new DropZone("form#" + this.dzId, {
                                                                        acceptedFiles: "image/*",
                                                                        addRemoveLinks: true,
                                                                        autoProcessQueue: false,
                                                                        maxFiles: 1,
                                                                        maxfilesexceeded: function (e) {
                                                                            this.removeFile(e);
                                                                        },
                                                                        maxfilesreached: () => {
                                                                            this._drawPointCanvas();
                                                                        },
                                                                        paramName: "chunkContent",
                                                                        url: "#",
                                                                    });
                                                                    this.dropZone.on("addedfile", () => {
                                                                        this._drawPointCanvas();
                                                                    });
                                                                    this.dropZone.on("removedfile", () => {
                                                                        this._drawPointCanvas();
                                                                    });
                                                                    this.dropZone.on("resetFiles", function () {
                                                                        this.removeAllFiles(true);
                                                                    });
                                                                }
                                                            }
                                                        }]
                                                    }).dxForm("instance");
                                                }
                                            },
                                            items: [{
                                                id: "icon"
                                            }, {
                                                id: "image"
                                            }],
                                            loop: false,
                                            onSelectionChanged: () => {
                                                this._drawPointCanvas();
                                            },
                                            selectedIndex: 0,
                                            swipeEnabled: false,
                                        }).dxMultiView("instance");
                                } else {
                                    const canvasContainer = $("<div />").height("100%").css("display", "flex").css("align-items", "center").appendTo(itemElement);
                                    this.pointCanvas = $("<canvas />").css("margin", "auto").appendTo(canvasContainer);
                                }
                            },
                            items: [{}, {}],
                            rows: [{}],
                        });
                }
            }, {
                colSpan: 2,
                template: () => {
                    return "<hr style=\"margin: 5px 0;\" />";
                }
            }, {
                buttonOptions: {
                    onClick: () => {
                        // 0 là biểu tượng dạng điểm, 1 là biểu tượng dạng ảnh
                        if (this.pointFormViews.option("selectedIndex") === 0) {
                            const style = this.iconForm.option("formData").data;
                            if (this.deffered) {
                                this.deffered.resolve({
                                    geoStyler: style,
                                    type: "style",
                                });
                                this.hide();
                            } else {
                                LayerService.setStyle(this.oGLayer.id, JSON.stringify(style)).then(result => {
                                    if (result.status === EnumStatus.OK) {
                                        OGUtils.alert("Lưu thiết lập thành công!");
                                        this.refreshLayerGrid();
                                        this.hide();
                                    } else {
                                        OGUtils.error("Lưu thiết lập thất bại, vui lòng kiểm tra lại!", "Lỗi");
                                    }
                                });
                            }
                        } else if (this.pointFormViews.option("selectedIndex") === 1) {
                            const imageData = this.imageForm.option("formData");
                            const style = this.imageForm.option("formData").data;
                            if (this.deffered) {
                                this.deffered.resolve({
                                    geoStyler: style,
                                    type: "style",
                                });
                                this.hide();
                            } else {
                                style.offset = [imageData.offsetX, imageData.offsetY];
                                LayerService.setStyle(this.oGLayer.id, JSON.stringify(style), imageData.offsetX, imageData.offsetY).then(result => {
                                    if (result.status === EnumStatus.OK) {
                                        OGUtils.alert("Lưu thiết lập thành công!");
                                        this.refreshLayerGrid();
                                        this.hide();
                                    } else {
                                        OGUtils.error("Lưu thiết lập thất bại, vui lòng kiểm tra lại!", "Lỗi");
                                    }
                                });
                            }
                        }
                    },
                    stylingMode: "contained",
                    text: "Lưu thiết lập biểu tượng",
                    type: "default"
                },
                colSpan: 2,
                horizontalAlignment: "center",
                itemType: "button"
            }],
            labelLocation: "top",
        }).dxForm("instance");

        this._drawPointCanvas();
    }

    // Form biểu tượng dạng vùng
    private _initPolygonForm(container): void {
        this.polygonForm = $("<div />").appendTo(container).dxForm({
            colCount: 2,
            formData: {
                "fillColor": "#000000",
                "fillOpacity": 1.0,
                "strokeColor": "#000000",
                "strokeWidth": 1
            },
            items: [{
                dataField: "strokeWidth",
                editorOptions: {

                    mode: "number",
                    onValueChanged: () => {
                        this._drawPolygonCanvas();
                    },
                    showSpinButtons: true,
                    visible: true
                },
                editorType: "dxNumberBox",

                label: {
                    text: "Độ rộng viền"
                },
            }, {
                dataField: "strokeColor",
                editorOptions: {
                    editAlphaChannel: true,

                    onValueChanged: () => {
                        this._drawPolygonCanvas();
                    }
                },
                editorType: "dxColorBox",
                label: {
                    text: "Màu viền"
                }
            }, {
                dataField: "fillColor",
                editorOptions: {
                    editAlphaChannel: true,
                    onValueChanged: () => {
                        this._drawPolygonCanvas();
                    }
                },
                editorType: "dxColorBox",
                label: {
                    text: "Màu nền"
                }
            }, {
                dataField: "fillOpacity",
                editorOptions: {

                    max: 1.0,
                    min: 0.0,
                    onValueChanged: () => {
                        this._drawPolygonCanvas();
                    }
                },
                editorType: "dxNumberBox",
                label: {
                    text: "Độ mờ"
                }
            }, {
                colSpan: 2,
                template: (itemData, itemElement) => {
                    const polygonCanvasContainer = $("<div />").width("100%").css("display", "flex").css("align-items", "center").appendTo(itemElement);
                    this.polygonCanvas = $("<canvas />").css("margin", "auto").appendTo(polygonCanvasContainer);
                }
            }, {
                colSpan: 2,
                template: () => {
                    return "<hr style=\"margin: 5px 0;\" />";
                }
            }, {
                buttonOptions: {
                    onClick: () => {
                        const style = this.polygonForm.option("formData").data;
                        if (this.deffered) {
                            this.deffered.resolve({
                                geoStyler: style,
                                type: "style",
                            });
                            this.hide();
                        } else {
                            LayerService.setStyle(this.oGLayer.id, JSON.stringify(style)).then(result => {
                                if (result.status === EnumStatus.OK) {
                                    OGUtils.alert("Lưu thiết lập thành công!");
                                    this.refreshLayerGrid();
                                    this.hide();
                                } else {
                                    OGUtils.error("Lưu thiết lập thất bại, vui lòng kiểm tra lại!", "Lỗi");
                                }
                            });
                        }
                    },
                    stylingMode: "contained",
                    text: "Lưu thiết lập",
                    type: "default"
                },
                colSpan: 2,
                horizontalAlignment: "center",
                itemType: "button"
            }],
            labelLocation: "top",
            onInitialized: function () {

            }
        }).dxForm("instance");
        //
        this._drawPolygonCanvas();
    }

    // Xây dựng form chỉnh sửa biểu tượng
    private _initStyleEditor(container): void {
        this.rootView = $("<div />").appendTo(container).dxMultiView({
            animationEnabled: true,
            deferRendering: false,
            itemTemplate: (itemData, itemIndex, itemElement) => {
                if (itemData.geometry === "Point" || itemData.geometry === "MultiPoint") {
                    this._initPointForm(itemElement);
                } else if (itemData.geometry === "LineString" || itemData.geometry === "MultiLineString") {
                    this._initLineStringForm(itemElement);
                } else if (itemData.geometry === "Polygon" || itemData.geometry === "MultiPolygon") {
                    this._initPolygonForm(itemElement);
                }
            },
            items: [{
                geometry: "Point"
            }, {
                geometry: "LineString"
            }, {
                geometry: "Polygon"
            }],
            loop: false,
            swipeEnabled: false,
        }).dxMultiView("instance");
    }

    private _stringToColorArray(color: string): number[] {
        color = color.trim().replace("rgba(", "").replace(")", "");
        const colorArray: string[] = color.split(",");
        const arr = colorArray.map((i) => Number(i));
        if (arr[3] == 1) {
            arr[3] = 255;
        }
        return arr;
    }

    private textStyleToCanvas(style: Style, canvas: HTMLCanvasElement): void {
        if (style instanceof Style === false) {
            // reject(new Error('olStyle is not instance of Open Layer Style'));
        } else {
            try {
                const h = canvas.height;
                const w = canvas.width;
                const context = toContext(canvas.getContext("2d"), {
                    size: [w, h]
                });
                context.setStyle(style);
                //
                if (this.oGLayer) {
                    if (this.oGLayer.geometry === EnumGeometry.LineString || this.oGLayer.geometry === EnumGeometry.MultiLineString) {
                        context.drawGeometry(new LineString([
                            [0, h],
                            [w, h]
                        ]));
                    } else if (this.oGLayer.geometry === EnumGeometry.Point || this.oGLayer.geometry === EnumGeometry.MultiPoint) {
                        context.drawGeometry(new Point([w / 2, h / 2]));
                    } else if (this.oGLayer.geometry === EnumGeometry.Polygon || this.oGLayer.geometry === EnumGeometry.MultiPolygon) {
                        context.drawGeometry(new Polygon([
                            [
                                [0, 0],
                                [0, h],
                                [w, h],
                                [w, 0],
                                [0, w]
                            ]
                        ]));
                    }
                } else {
                    context.drawGeometry(new Point([canvas.width / 2, canvas.height / 2]));
                }
                //
                OGMapUtils.olStyleToGeoStylerStyle(style).then(result => {
                    // canvas.data("sld", result);
                    // canvas.data("geoStyler", result);
                });
            } catch (e) {
                console.error(e);
            }
        }
    }

    public for(layerInfo: OGLayerModel, def?, layerGrid?: dxDataGrid): StyleEditorComponent {
        this.deffered = def;
        this.oGLayer = layerInfo;
        this.layerGrid = layerGrid;
        // Remove existing file
        this.dropZone.emit("resetFiles");
        $("form#" + this.dzId).find(".dz-image-preview").remove();

        if (layerInfo.geometry === "Point" || layerInfo.geometry === "MultiPoint") {
            this.rootView.option("selectedIndex", 0);
        } else if (layerInfo.geometry === "LineString" || layerInfo.geometry === "MultiLineString") {
            this.rootView.option("selectedIndex", 1);
        } else if (layerInfo.geometry === "Polygon" || layerInfo.geometry === "MultiPolygon") {
            this.rootView.option("selectedIndex", 2);
        }
        if (this.oGLayer.label_styles) {
            const labelStyles = JSON.parse(this.oGLayer.label_styles);
            if (labelStyles
                && labelStyles.rules
                && labelStyles.rules.length > 0
                && labelStyles.rules[0].symbolizers
                && labelStyles.rules[0].symbolizers.length > 0
            ) {
                const config = labelStyles.rules[0].symbolizers[0];
                this.labelForm.option("formData", {
                    font: config.font[0],
                    is_label_visible: layerInfo.is_label_visible,
                    offsetX: config.offset[0],
                    offsetY: config.offset[1],
                    strokeColor: config.haloColor,
                    strokeWidth: config.haloWidth,
                    textColor: config.color,
                    textSize: config.size
                });

                this._drawTextCanvas();
            }
        } else {
            this.labelForm.option("formData", {
                font: "Reddit Sans",
                is_label_visible: layerInfo.is_label_visible,
                offsetX: 0,
                offsetY: 0,
                strokeColor: "#000000",
                strokeWidth: 1,
                textColor: "#FFFFFF",
                textSize: 12
            });
        }
        if (this.oGLayer.styles) {
            const styles = JSON.parse(this.oGLayer.styles) as GeoStylerStyle;
            if (styles
                && styles.rules
                && styles.rules.length > 0
                && styles.rules[0].symbolizers
                && styles.rules[0].symbolizers.length > 0
            ) {
                this.geoStylerSymbolizer = styles.rules[0].symbolizers[0];
                const offset = styles["offset"] ?? [0.5, 0.5];
                if (this.oGLayer.geometry === "Point" || this.oGLayer.geometry === "MultiPoint") {
                    this.rootView.option("selectedIndex", 0);
                    let pointData = {}; let iconData = {}; let imageData = {};
                    if (isIconSymbolizer(this.geoStylerSymbolizer)) {
                        pointData = {
                            size: this.geoStylerSymbolizer.size ? this.geoStylerSymbolizer.size : 24,
                            type: 1
                        };
                        // const offset = (this.geoStylerSymbolizer as IconSymbolizer).offset ?? [0.5, 0.5];
                        imageData = {
                            image: (this.geoStylerSymbolizer as IconSymbolizer).image,
                            offsetX: offset[0],
                            offsetY: offset[1],
                            opacity: this.geoStylerSymbolizer.opacity,
                            rotate: this.geoStylerSymbolizer.rotate,
                            size: this.geoStylerSymbolizer.size
                        };

                        if (isSprite(imageData["image"])) {
                            this.dropZone.displayExistingFile({ name: "icon", size: 0 }, imageData["image"].source);
                        }
                        else {
                            this.dropZone.displayExistingFile({ name: "icon", size: 0 }, imageData["image"]);
                        }
                    } else if (this.geoStylerSymbolizer.kind) {
                        pointData = {
                            size: (this.geoStylerSymbolizer as MarkSymbolizer).radius ? (this.geoStylerSymbolizer as MarkSymbolizer).radius : 24,
                            type: 0
                        };
                        iconData = {
                            fillColor: (this.geoStylerSymbolizer as MarkSymbolizer).color,
                            // shape: styles[0],
                            shape: (this.geoStylerSymbolizer as MarkSymbolizer).wellKnownName,
                            strokeColor: (this.geoStylerSymbolizer as MarkSymbolizer).strokeColor,
                            strokeWidth: (this.geoStylerSymbolizer as MarkSymbolizer).strokeWidth ? (this.geoStylerSymbolizer as MarkSymbolizer).strokeWidth : 0
                        };
                    }

                    this.pointForm.option("formData", pointData);
                    if (this.imageForm) {
                        this.imageForm.option("formData", imageData);
                    }
                    if (this.iconForm) {
                        this.iconForm.option("formData", iconData);
                    }
                    this._drawPointCanvas();
                } else if (this.oGLayer.geometry === "LineString" || this.oGLayer.geometry === "MultiLineString") {
                    this.rootView.option("selectedIndex", 1);
                    const lineStringData = {
                        dashWidth: (this.geoStylerSymbolizer as LineSymbolizer).dasharray ? (this.geoStylerSymbolizer as LineSymbolizer).dasharray : 0,
                        opacity: this.geoStylerSymbolizer.opacity,
                        strokeColor: (this.geoStylerSymbolizer as LineSymbolizer).color,
                        strokeWidth: (this.geoStylerSymbolizer as LineSymbolizer).width
                    };
                    this.lineStringForm.option("formData", lineStringData);
                    this._drawLineStringCanvas();
                } else if (this.oGLayer.geometry === "Polygon" || this.oGLayer.geometry === "MultiPolygon") {
                    this.rootView.option("selectedIndex", 2);
                    const polygonData = {
                        fillColor: (this.geoStylerSymbolizer as FillSymbolizer).color,
                        fillOpacity: this.geoStylerSymbolizer.opacity,
                        strokeColor: (this.geoStylerSymbolizer as FillSymbolizer).outlineColor,
                        strokeWidth: (this.geoStylerSymbolizer as FillSymbolizer).outlineWidth,
                    };
                    this.polygonForm.option("formData", polygonData);
                    this._drawPolygonCanvas();
                }
            }
        }
        return this;
    }

    public forStyle(layerInfo: OGLayerModel, style: GeoStylerStyle, def?): StyleEditorComponent {
        this.deffered = def;
        this.oGLayer = layerInfo;
        // Remove existing file
        this.dropZone.emit("resetFiles");
        $("form#" + this.dzId).find(".dz-image-preview").remove();

        if (layerInfo.geometry === "Point" || layerInfo.geometry === "MultiPoint") {
            this.rootView.option("selectedIndex", 0);
        } else if (layerInfo.geometry === "LineString" || layerInfo.geometry === "MultiLineString") {
            this.rootView.option("selectedIndex", 1);
        } else if (layerInfo.geometry === "Polygon" || layerInfo.geometry === "MultiPolygon") {
            this.rootView.option("selectedIndex", 2);
        }
        if (this.oGLayer.label_styles) {
            const labelStyles = JSON.parse(this.oGLayer.label_styles);
            if (labelStyles
                && labelStyles.rules
                && labelStyles.rules.length > 0
                && labelStyles.rules[0].symbolizers
                && labelStyles.rules[0].symbolizers.length > 0
            ) {
                const config = labelStyles.rules[0].symbolizers[0];
                this.labelForm.option("formData", {
                    font: config.font[0],
                    is_label_visible: layerInfo.is_label_visible,
                    offsetX: config.offset[0],
                    offsetY: config.offset[1],
                    strokeColor: config.haloColor,
                    strokeWidth: config.haloWidth,
                    textColor: config.color,
                    textSize: config.size
                });

                this._drawTextCanvas();
            }
        } else {
            this.labelForm.option("formData", {
                font: "Reddit Sans",
                is_label_visible: layerInfo.is_label_visible,
                offsetX: 0,
                offsetY: 0,
                strokeColor: "#000000",
                strokeWidth: 1,
                textColor: "#FFFFFF",
                textSize: 12
            });
        }
        if (style) {
            const styles = Object.assign({}, style);
            if (styles
                && styles.rules
                && styles.rules.length > 0
                && styles.rules[0].symbolizers
                && styles.rules[0].symbolizers.length > 0
            ) {
                this.geoStylerSymbolizer = styles.rules[0].symbolizers[0];
                const offset = styles["offset"] ?? [0.5, 0.5];
                if (this.oGLayer.geometry === "Point" || this.oGLayer.geometry === "MultiPoint") {
                    this.rootView.option("selectedIndex", 0);
                    let pointData = {}; let iconData = {}; let imageData = {};
                    if (isIconSymbolizer(this.geoStylerSymbolizer)) {
                        pointData = {
                            size: this.geoStylerSymbolizer.size ? this.geoStylerSymbolizer.size : 24,
                            type: 1
                        };
                        // const offset = (this.geoStylerSymbolizer as IconSymbolizer).offset ?? [0.5, 0.5];
                        imageData = {
                            image: (this.geoStylerSymbolizer as IconSymbolizer).image,
                            offsetX: offset[0],
                            offsetY: offset[1],
                            opacity: this.geoStylerSymbolizer.opacity,
                            rotate: this.geoStylerSymbolizer.rotate,
                            size: this.geoStylerSymbolizer.size
                        };

                        if (isSprite(imageData["image"])) {
                            this.dropZone.displayExistingFile({ name: "icon", size: 0 }, imageData["image"].source);
                        }
                        else {
                            this.dropZone.displayExistingFile({ name: "icon", size: 0 }, imageData["image"]);
                        }
                    } else if (this.geoStylerSymbolizer.kind) {
                        pointData = {
                            size: (this.geoStylerSymbolizer as MarkSymbolizer).radius ? (this.geoStylerSymbolizer as MarkSymbolizer).radius : 24,
                            type: 0
                        };
                        console.log((this.geoStylerSymbolizer as MarkSymbolizer).wellKnownName);
                        iconData = {
                            fillColor: (this.geoStylerSymbolizer as MarkSymbolizer).color,
                            // shape: styles[0],
                            shape: (this.geoStylerSymbolizer as MarkSymbolizer).wellKnownName,
                            strokeColor: (this.geoStylerSymbolizer as MarkSymbolizer).strokeColor,
                            strokeWidth: (this.geoStylerSymbolizer as MarkSymbolizer).strokeWidth ? (this.geoStylerSymbolizer as MarkSymbolizer).strokeWidth : 0
                        };
                    }

                    this.pointForm.option("formData", pointData);
                    if (this.imageForm) {
                        this.imageForm.option("formData", imageData);
                    }
                    if (this.iconForm) {
                        this.iconForm.option("formData", iconData);
                    }
                    this._drawPointCanvas();
                } else if (this.oGLayer.geometry === "LineString" || this.oGLayer.geometry === "MultiLineString") {
                    this.rootView.option("selectedIndex", 1);
                    const lineStringData = {
                        dashWidth: (this.geoStylerSymbolizer as LineSymbolizer).dasharray ? (this.geoStylerSymbolizer as LineSymbolizer).dasharray : 0,
                        opacity: this.geoStylerSymbolizer.opacity,
                        strokeColor: (this.geoStylerSymbolizer as LineSymbolizer).color,
                        strokeWidth: (this.geoStylerSymbolizer as LineSymbolizer).width
                    };
                    this.lineStringForm.option("formData", lineStringData);
                    this._drawLineStringCanvas();
                } else if (this.oGLayer.geometry === "Polygon" || this.oGLayer.geometry === "MultiPolygon") {
                    this.rootView.option("selectedIndex", 2);
                    const polygonData = {
                        fillColor: (this.geoStylerSymbolizer as FillSymbolizer).color,
                        fillOpacity: this.geoStylerSymbolizer.opacity,
                        strokeColor: (this.geoStylerSymbolizer as FillSymbolizer).outlineColor,
                        strokeWidth: (this.geoStylerSymbolizer as FillSymbolizer).outlineWidth,
                    };
                    this.polygonForm.option("formData", polygonData);
                    this._drawPolygonCanvas();
                }
            }
        }
        return this;
    }

    public hide(): void {
        if (this.popup) {
            this.popup.hide();
        }
    }

    public onInit(): void {
        this.popup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                container.addClass("style-editor-container");
                //
                this.tab = $("<div />").appendTo(container).dxTabPanel({
                    animationEnabled: false,
                    deferRendering: false,
                    itemTemplate: (itemData, itemIndex, itemElement) => {
                        if (itemData.id === "symbol") {
                            this._initStyleEditor(itemElement);
                        } else {
                            this._initLabelEditor(itemElement);
                        }
                    },
                    itemTitleTemplate: (itemData) => {
                        return itemData.text;
                    },
                    items: [{
                        id: "symbol",
                        text: "Biểu tượng"
                    }, {
                        id: "label",
                        text: "Label"
                    }],
                    loop: false,
                    onSelectionChanged: () => {
                        this._drawTextCanvas();
                        if (this.oGLayer.geometry === "Point" || this.oGLayer.geometry === "MultiPoint") {
                            this._drawPointCanvas();
                        } else if (this.oGLayer.geometry === "LineString" || this.oGLayer.geometry === "MultiLineString") {
                            this._drawLineStringCanvas();
                        } else if (this.oGLayer.geometry === "Polygon" || this.oGLayer.geometry === "MultiPolygon") {
                            this._drawPolygonCanvas();
                        }
                    },
                    selectedIndex: 0,
                    swipeEnabled: false
                }).dxTabPanel("instance");
            },
            deferRendering: false,
            dragEnabled: true,
            height: "auto",
            hideOnOutsideClick: false,
            onHidden: () => {
                if (this.tab) {
                    this.tab.option("selectedIndex", 0);
                }
            },
            onOptionChanged: () => {
            },
            resizeEnabled: false,
            shading: true,
            showCloseButton: true,
            showTitle: true,
            title: "Thiết lập biểu tượng",
            width: 600,
        }).dxPopup("instance");
    }

    refreshLayerGrid(): void {
        if (this.layerGrid) {
            this.layerGrid.getDataSource().reload();
        }
    }

    public show(): void {
        if (this.popup) {
            this.popup.show();
        }
    }
}

export { StyleEditorComponent };