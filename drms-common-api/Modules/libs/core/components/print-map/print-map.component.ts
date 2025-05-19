import { OGMap } from "@opengis/map";
import Handlebars from "handlebars";
import PrintDialog from "ol-ext/control/PrintDialog";

import { IMapComponent } from "../base-component.abstract";
import "./print-map.component.scss";
import SelectMarginTemp from "./templates/select_margin.hbs";
import SelectPageSizeTem from "./templates/select_page_size.hbs";
import SelectSaveTemp from "./templates/select_save.hbs";

class PrintMapComponent implements IMapComponent {
    oGMap: OGMap;
    printControl: PrintDialog;
    constructor(oGMap: OGMap) {
        this.oGMap = oGMap;
        this.onInit();
    }

    private _initLayout(): void {
        $(".ol-print-param").find("h2").html("In bản đồ");
        $(".ol-print-param").find(".ol-orientation").find(".portrait > span").html("Dọc");
        $(".ol-print-param").find(".ol-orientation").find(".landscape > span").html("Ngang");
        //
        $(".ol-print-param").find(".ol-size").find("label").html("Kích thước trang");
        $(".ol-print-param").find(".ol-size").find("select").html(Handlebars.compile(SelectPageSizeTem)({}));
        //
        $(".ol-print-param").find(".ol-margin").find("label").html("Căn lề");
        $(".ol-print-param").find(".ol-margin").find("select").html(Handlebars.compile(SelectMarginTemp)({}));
        //
        $(".ol-print-param").find(".ol-scale").find("label").html("Tỉ lệ");
        $(".ol-print-param").find(".ol-print-north").find("label").html("Mũi tên hướng bắc <input type='checkbox'><span></span>");
        //
        $(".ol-print-param").find(".ol-saveas").find(".ol-clipboard-copy").html("✔ Đã sao chép vào bộ nhớ đệm");
        $(".ol-print-param").find(".ol-saveas").find("select").html(Handlebars.compile(SelectSaveTemp)({}));
        //
        $(".ol-print-param").find(".ol-ext-buttons").find("button[type=\"submit\"]").html("In...").css("background-color", "#265a87");
        $(".ol-print-param").find(".ol-ext-buttons").find("button[type=\"button\"]").html("Hủy").css("background-color", "#ce312c").css("color", "#fff").css("font-weight", "bold");
    }

    private _initLoadPrint(): void {
        this.printControl = new PrintDialog({
            // align: "top-right",
        });
        this.printControl.setSize("A4");
        this.oGMap.olMap.addControl(this.printControl);
        $(".ol-print.ol-unselectable.ol-control").css("display", "none");

        /* On print > save image file */
        // this.printControl.on("print", function (e) {
        //     // Print success
        //     if (e.image) {
        //         if (e.pdf) {
        //             // Export pdf using the print info
        //             const pdf = new jsPDF({
        //                 format: e.print.size,
        //                 orientation: e.print.orientation,
        //                 unit: e.print.unit
        //             });
        //             pdf.addImage(e.image, "JPEG", e.print.position[0], e.print.position[0], e.print.imageWidth, e.print.imageHeight);
        //             pdf.save(e.print.legend ? "legend.pdf" : "map.pdf");
        //         } else {
        //             // Save image as file
        //             e.canvas.toBlob(function () {
        //                 (e.print.legend ? "legend." : "map.") + e.imageType.replace("image/", "");
        //             }, e.imageType, e.quality);
        //         }
        //     } else {
        //         console.warn("No canvas to export");
        //     }
        // });
    }

    public getPrintControl(): PrintDialog {
        return this.printControl;
    }

    onInit(): void {
        // const canvas = document.getElementById("map").getElementsByClassName("ol-unselectable")[0] as HTMLCanvasElement;
        // window.print(canvas.toDataURL("image/jpg"));
        this._initLoadPrint();
        this._initLayout();
        //this.g_Popup = this.g_PopupContainer.dxPopup({
        //    width: '90%',
        //    height: '90%',
        //    showTitle: true,
        //    title: "Định dạng in",
        //    hideOnOutsideClick: false,
        //    dragEnabled: true,
        //    deferRendering: false,
        //    shading: true,
        //    resizeEnabled: false,
        //    position: {
        //        my: "center",
        //        at: "center",
        //        of: window
        //    },

        //    contentTemplate: (container) => {
        //        this.settingContainer = $('<div />').appendTo(container).addClass("col-md-2");
        //        this.imageContainer = $('<div />').appendTo(container).addClass("col-md-10");
        //        this.button = $('<div />').addClass("col-md-2")
        //        window.prints = this.imag;
        //        //this.g_Button.dxButton({

        //        //    icon: 'print',
        //        //    text: 'Thực thi',
        //        //    onClick: () => {
        //        //        //$('.page-navbar-menu').hide();
        //        //        //this.g_Popup.visible = false;
        //        //        window.imgp = this.img;
        //        //        window.print(this.img);
        //        //        //$('.page-navbar-menu').show();
        //        //      //  this.g_Popup.show();


        //        //    }
        //        //}).dxButton("instance");
        //        this.settingContainer.dxForm({
        //            readOnly: false,
        //            showColonAfterLabel: true,
        //            showValidationSummary: true,
        //            validationGroup: "customerData",
        //            items: [{

        //                itemType: "button",
        //                horizontalAlignment: "left",
        //                buttonOptions: {
        //                    icon: 'print',
        //                    text: 'Thực thi',
        //                    useSubmitBehavior: true,
        //                    onClick: () => {
        //                        var canvas = document.getElementById("map").getElementsByClassName("ol-unselectable")[0];
        //                        var img = canvas.toDataURL("image/png");
        //                        console.log(canvas);
        //                        var a = window.open("", "printwindow");
        //                        a.document.open("text/html");
        //                        a.document.write(`<html><head>
        //                    <link rel='stylesheet' type='text/css' href='/print/style.css'>
        //                    <link rel='stylesheet' type='text/css' href='/print/printmap.css'>
        //                    <style type='text/css'>
        //                        .olControlPanPanel {display:none;}  
        //                        .olControlZoomPanel {display:none;}
        //                    </style>
        //                    <script>
        //                        function printmap(){
        //                            //document.getElementById('print').style.visibility = 'hidden';
        //                            window.print();
        //                        }
        //                    </script>
        //                    </head><body><div>
        //                     <div class='printContentWrapper core hasMap' id='printContentWrapper'>
        //                     <table class='printHeader'>
        //                     <tbody><tr>
        //                     <td class='notesCell' valign='bottom'>
        //                     <div id='notes'>

        //                     <div id='content'>
        //                     <div class='contentContainer'></div></div>
        //                     <div id='main-content' class='olMap'><img src='${img}' style='width:50%;height:50%' /></div> 
        //                     <div id='verticalColumn' class='verticalColumn'>
        //                     <div class='customizeWrapper'>
        //                     <button id='print' onclick='printmap();' style='margin:20px;width:120px;height:30px;'>IN BẢN ĐỒ</button>
        //                     </div>
        //                     </div>
        //                     </div><div></div>
        //                    </body ></html > `);
        //                        ////  document.getElementById(map).innerHTML  
        //                        a.document.close();
        //                        // mywindow.close();
        //                    }
        //                }

        //            }]

        //        }).dxForm('instance');
        //    },
        //    onShowing: () => {
        //        let canvas = document.getElementById('map').getElementsByClassName('ol-unselectable')[0];

        //        this.img = new Image();

        //        this.img.src = canvas.toDataURL('image/jpg');
        //        this.img.className = "img-responsive";
        //        this.img.id = "img-print";
        //        this.imageContainer.html(this.img);
        //        // window.print("'" + this.img.src + "'");
        //        // window.imgp = this.img;
        //    },
        //    onHidden: () => {
        //        this.emit('hidden');
        //    },
        //}).dxPopup('instance');
    }

    //show() {
    //    if (this.g_Popup) {
    //        this.g_Popup.show();
    //    }
    //}

    //hide() {
    //    if (this.g_Popup) {
    //        this.g_Popup.hide();
    //    }
    //    this.g_MapCore.clearInteractions();
    //    this.g_MapCore.clearInteractionModify();
    //    this.emit('stopEdit');
    //}

}

export { PrintMapComponent };