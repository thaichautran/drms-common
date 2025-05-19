import * as dialog from "devextreme/ui/dialog";
import dxLoadPanel from "devextreme/ui/load_panel";
import Notify from "devextreme/ui/notify";
import * as uuid from "uuid";

import { RestError } from "../models/base-response.model";
import { OGLayerModel } from "../models/layer.model";

class OGUtils {
    private static loadPanel: dxLoadPanel;

    public static ajaxPost(option): void {
        this.rectifyFields(option.data);
        $.ajax({
            contentType: "application/json; charset=utf8;",
            data: JSON.stringify(option.data),
            dataType: "json",
            error(e) {
                if (option.error)
                    option.error(e);
            },
            success(response) {
                if (option.success)
                    option.success(response);
            },
            type: "post",
            url: option.url,
        });
    }

    public static ajaxPostFile(option): JQueryXHR {
        return $.ajax({
            cache: false,
            contentType: false,
            data: option.formData,
            dataType: "json",
            error(jqXHR, textStatus, errorThrown) {
                if (option.error) {
                    option.error(jqXHR, textStatus, errorThrown);
                }
            },
            processData: false,
            success(response, textStatus, jqXHR) {
                if (option.success) {
                    option.success(response, textStatus, jqXHR);
                }
            },
            type: "POST",
            url: option.url
        });
    }

    public static ajaxPostFileAwait(option): void {
        const xhr = $.ajax({
            async: false,
            cache: false,
            contentType: false,
            data: option.formData,
            dataType: "json",
            error(jqXHR, textStatus, errorThrown) {
                if (option.error)
                    option.error(jqXHR, textStatus, errorThrown);
            },
            processData: false,
            success(response, textStatus, jqXHR) {
                if (option.success)
                    option.success(response, textStatus, jqXHR);
            },
            type: "POST",
            url: option.url
        }).responseText;
        return JSON.parse(xhr);
    }

    public static alert(message: RestError | string, title?: string): Promise<boolean> {
        this.hideLoading();
        let content = "";
        if (message instanceof Object) {
            const err = message as RestError;
            if (err.errors && err.errors.length > 0) {
                content = `${err.errors[0].message} (Mã lỗi: ${err.errors[0].code})`;
            } else {
                content = "Lỗi không xác định";
            }
        } else {
            content = message.toString();
        }
        return new Promise((resolve) => {
            const d = dialog.custom({
                buttons: [{
                    onClick: function () {
                        resolve(true);
                        d.hide();
                    },
                    text: "Đồng ý",
                    type: "default"
                }],
                messageHtml: content,
                title: title || "Thông báo",
            });
            // $(".dx-dialog").dxPopup('instance').option("animation", null);
            d.show();
        });
    }

    public static buildFormData(formData, data, parentKey?: string): FormData {
        const self = this;
        if (data && typeof data === "object" && !(data instanceof Date) && !(data instanceof File)) {
            Object.keys(data).forEach(key => {
                const k = self._isFileList(data) ? parentKey : `${parentKey}[${key}]`;
                self.buildFormData(formData, data[key], parentKey ? k : key);
            });
        } else {
            const value = data == null ? "" : data;
            formData.append(parentKey, value);
        }
        return formData;
    }

    public static confirm(message: string, title?: string): Promise<boolean> {
        this.hideLoading();
        return new Promise((resolve) => {
            const d = dialog.custom({
                buttons: [{
                    onClick: function () {
                        resolve(true);
                        d.hide();
                    },
                    text: "Có",
                    type: "default"
                }, {
                    onClick: function () {
                        resolve(false);
                        d.hide();
                    },
                    text: "Không",
                    type: "danger"
                }],
                messageHtml: message,
                title: title || "Xác nhận"
            });
            // $(".dx-dialog").dxPopup('instance').option("animation", null);
            d.show();
        });
    }

    public static dateToDateStringQuery(date): string {
        const mm = date.getMonth() + 1;
        const dd = date.getDate();
        return [
            date.getFullYear(),
            (mm > 9 ? "" : "0") + mm,
            (dd > 9 ? "" : "0") + dd,
        ].join("-");
    }

    public static dateToString(date): string {
        const mm = date.getMonth() + 1;
        const dd = date.getDate();
        return [
            (dd > 9 ? "" : "0") + dd,
            (mm > 9 ? "" : "0") + mm,
            date.getFullYear()
        ].join("-");
    }

    public static dateToTimeString(date): string {
        const timeString = `${this.dateToString(date)} ${this.getTimeFromDate(date)}`;
        return timeString;
    }

    public static delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    public static distinct(array: Array<unknown>): Array<unknown> {
        return array.filter((value, index, array) => array.indexOf(value) === index);
    }

    public static error(message, title?): Promise<boolean> {
        this.hideLoading();
        return new Promise((resolve) => {
            const d = dialog.custom({
                buttons: [{
                    onClick: function () {
                        resolve(true);
                        d.hide();
                    },
                    text: "Đồng ý",
                    type: "default"
                }],
                messageHtml: message,
                title: title || "Lỗi"
            });
            // $(".dx-dialog").dxPopup('instance').option("animation", null);
            d.show();
        });
    }

    public static formDataToJson(formData: FormData): object {
        return Object.fromEntries(formData);
    }
    public static formatNumber(number: number, minDigits?: number, maxDigits?: number): string {
        return (number ?? 0).toLocaleString("vi-VN", { maximumFractionDigits: maxDigits || 6, minimumFractionDigits: minDigits || 0 });
    }

    public static getFormDataAsJsonObject($form: JQuery<HTMLFormElement>): object {
        const unIndexedArray = $form.serializeArray();
        const indexedArray = {};

        $.map(unIndexedArray, function (n) {
            indexedArray[n["name"]] = n["value"];
        });

        return indexedArray;
    }

    public static getListPage(currentPage, totalPage, showPageNumber): number[] {
        const listPage = [];

        let minPage, maxPage;

        currentPage = parseInt(currentPage);
        totalPage = parseInt(totalPage);
        showPageNumber = parseInt(showPageNumber);

        if (totalPage < showPageNumber) {
            minPage = 1;
            maxPage = totalPage;
        } else {
            const floor = Math.floor((totalPage - currentPage + 1) / showPageNumber);

            if (floor == 0) {
                minPage = totalPage - showPageNumber + 1;
                maxPage = totalPage;
            }
            else {
                minPage = currentPage > 1 ? currentPage - 1 : currentPage;
                maxPage = minPage + showPageNumber - 1;
            }
        }
        for (let i = minPage; i <= maxPage; i++) {
            listPage.push(i);
        }

        return listPage;
    }

    public static getRandomLineStringStyle(): object {
        return {
            "name": "OL Style",
            "rules": [{
                "name": "OL Style Rule 0",
                "symbolizers": [{
                    "cap": "round",
                    "color": this.randomColor(),
                    "dasharray": [1, 1],
                    "kind": "Line",
                    "width": 2
                }]
            }]
        };
    }


    public static getRandomPointStyle(): object {
        return {
            "name": "OL Style",
            "rules": [{
                "name": "OL Style Rule 0",
                "symbolizers": [{
                    "color": this.randomColor(),
                    "kind": "Mark",
                    "radius": 5,
                    "rotate": 0,
                    "strokeColor": "rgba(0, 0, 0, 1)",
                    "strokeWidth": 1,
                    "wellKnownName": "circle"
                }]
            }]
        };
    }
    public static getRandomPolygonStyle(): object {
        return {
            "name": "OL Style",
            "rules": [{
                "name": "OL Style Rule 0",
                "symbolizers": [{
                    "color": this.randomColor(),
                    "kind": "Fill",
                    "opacity": 0.5,
                    "outlineColor": "#000000",
                    "outlineWidth": 1
                }]
            }]
        };
    }

    public static getTimeFromDate(date): string {
        let timeString = "";
        let hours = date.getHours();
        let minutes = date.getMinutes();
        let seconds = date.getSeconds();
        if (hours < 10) hours = "0" + hours;
        if (minutes < 10) minutes = "0" + minutes;
        if (seconds < 10) seconds = "0" + seconds;
        timeString = hours + ":" + minutes;
        return timeString;
    }

    public static getUrlParams(param: string): string | undefined {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.has(param)) {
            return searchParams.get(param);
        }
        return undefined;
    }
    //Mảng đối tượng sau khi nhóm theo key
    public static groupBy(list, keyGetter): Map<string, OGLayerModel[]> {
        const map = new Map();
        list.forEach((item) => {
            const key = keyGetter(item);
            const collection = map.get(key);
            if (!collection) {
                map.set(key, [item]);
            } else {
                collection.push(item);
            }
        });
        return map;
    }
    public static hasHtmlTag(str): boolean {
        const htmlTag = /<(\w+)((?:\s+\w+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/;
        return htmlTag.test(str);
    }
    public static hasSpecialChar(str): boolean {
        return /[a-zA-Z0-9]+/g.test(str) === false;
    }

    //Returns :
    public static hideLoading(): void {
        if (this.loadPanel) {
            this.loadPanel.hide();
        }
    }

    //Summary :
    //    Nhóm một mảng đối tương
    //Parameters:
    //    list: Mảng
    //    keyGetter: Hàm lấy key nhóm đối tượng
    public static isNormalize(value): boolean {
        return /^[a-zA-Z0-9\\_]+$/.test(value);
    }

    public static isPhoneNumber(str): boolean {
        const specialChars = /^(?!00)(?:\+84|84|0)(?:3|5|7|8|9)\d{8}\b/;
        return str.match(specialChars)?.length > 0;
    }
    public static jsonToFormData(data): FormData {
        const self = this;
        const formData = new FormData();
        return self.buildFormData(formData, data);
    }

    public static postDownload(url: string, params?: object, contentType?: string): void {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.responseType = "arraybuffer";
        xhr.onloadstart = () => {
            this.showLoading();
        };
        xhr.onloadend = () => {
            this.hideLoading();
        };
        xhr.onload = (e: ProgressEvent) => {
            if (e.target["status"] === 200) {
                let filename = "";
                const disposition = xhr.getResponseHeader("Content-Disposition");
                if (disposition && disposition.indexOf("attachment") !== -1) {
                    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                    const matches = filenameRegex.exec(disposition);
                    if (matches != null && matches[1]) filename = matches[1].replace(/['"]/g, "");
                }
                const type = xhr.getResponseHeader("Content-Type");

                let blob;
                if (typeof File === "function") {
                    try {
                        blob = new File([e.target["response"]], filename, { type: type });
                    } catch (e) { /* Edge */ }
                }
                if (typeof blob === "undefined") {
                    blob = new Blob([e.target["response"]], { type: type });
                }

                if (typeof window.navigator["msSaveBlob"] !== "undefined") {
                    // IE workaround for "HTML7007: One or more blob URLs were revoked by closing the blob for which they were created. These URLs will no longer resolve as the data backing the URL has been freed."
                    window.navigator["msSaveBlob"](blob, filename);
                } else {
                    const URL = window.URL || window.webkitURL;
                    const downloadUrl = URL.createObjectURL(blob);

                    if (filename) {
                        // use HTML5 a[download] attribute to specify filename
                        const a = document.createElement("a");
                        // safari doesn't support this yet
                        if (typeof a.download === "undefined") {
                            window.location.href = downloadUrl;
                        } else {
                            a.href = downloadUrl;
                            a.download = filename;
                            document.body.appendChild(a);
                            a.click();
                        }
                    } else {
                        window.location.href = downloadUrl;
                    }

                    setTimeout(function () { URL.revokeObjectURL(downloadUrl); }, 100); // cleanup
                }
                /* $("body").loader("hide");*/
                this.hideLoading();
            }
        };
        if (contentType) {
            xhr.setRequestHeader("Content-type", contentType);
            xhr.send(JSON.stringify(params));
        } else {
            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xhr.send($.param(params));
        }
    }
    /**
 * @param numOfSteps: Total number steps to get color, means total colors
 * @param step: The step number, means the order of the color
 */
    public static rainbow(numOfSteps, step): string {
        // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
        // Adam Cole, 2011-Sept-14
        // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
        let r, g, b;
        const h = step / numOfSteps;
        const i = ~~(h * 999);
        const f = h * 6 - i;
        const q = 1 - f;
        switch (i % 6) {
            case 0: r = 1; g = f; b = 0; break;
            case 1: r = q; g = 1; b = 0; break;
            case 2: r = 0; g = 1; b = f; break;
            case 3: r = 0; g = q; b = 1; break;
            case 4: r = f; g = 0; b = 1; break;
            case 5: r = 1; g = 0; b = q; break;
        }
        const c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
        return (c);
    }

    static randomColor(): string {
        return "#" + Math.floor(Math.random() * 16777215).toString(16);
    }
    public static randomIpAddress(): string {
        return (Math.floor(Math.random() * 255) + 1) + "." + (Math.floor(Math.random() * 255)) + "." + (Math.floor(Math.random() * 255)) + "." + (Math.floor(Math.random() * 255));
    }
    public static rectifyFields(obj): void {
        if (obj && typeof obj === "object") {
            //this.removeEmptyFields(obj);
            Object.keys(obj).forEach(key => {
                if (obj[key]) {
                    if (typeof obj[key] === "object")
                        this.rectifyFields(obj[key]); // recurse
                    else if (obj[key] == null)
                        delete obj[key]; // delete
                    else if (typeof obj[key] === "string") {
                        if (typeof obj[key] !== "number" && !isNaN(Number(obj[key])))
                            obj[key] = Number(obj[key]);
                    } else if (Array.isArray(obj[key]) && obj[key].length > 0) {
                        obj[key].forEach(this.rectifyFields);
                    }
                }
            });
        }
    }

    public static removeEmptyFields(obj): void {
        if (obj && typeof obj === "object")
            Object.keys(obj).forEach(key => {
                if (obj[key] && typeof obj[key] === "object")
                    this.removeEmptyFields(obj[key]); // recurse
                else if (obj[key] == null) delete obj[key]; // delete
                else if (typeof obj[key] === "string") {
                    if (obj[key].trim() === "") delete obj[key];
                    else obj[key] = obj[key].trim();
                }
            });
    }

    public static showLoading(message: string = ""): void {
        if (!this.loadPanel) {
            this.loadPanel = $("<div />").appendTo("body").dxLoadPanel({
                hideOnOutsideClick: false,
                message: message !== "" ? message : "Đang tải...",
                onHidden: function () {
                },
                onShown: function () {
                },
                shading: true,
                showIndicator: true,
                showPane: true,
                // position: { of: "#employee" },
                visible: false
            }).dxLoadPanel("instance");
        }
        this.loadPanel.show();
    }
    public static toLowerCaseNonAccentVietnamese(str: string): string {
        str = str.toLowerCase();
        str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
        str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
        str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
        str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
        str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
        str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
        str = str.replace(/đ/g, "d");

        str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // Huyền sắc hỏi ngã nặng 
        str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // Â, Ê, Ă, Ơ, Ư
        return str;
    }
    public static toast(message: RestError | string, title?: string, type?: string): void {
        let content = "";
        if (message instanceof Object) {
            const err = message as RestError;
            if (err.errors && err.errors.length > 0) {
                content = `${err.errors[0].message} (Mã lỗi: ${err.errors[0].code})`;
            } else {
                content = "Lỗi không xác định";
            }
        } else {
            content = message.toString();
        }
        Notify({
            animation: {
                hide: { duration: 40, to: 0, type: "fade" },
                show: {
                    duration: 400, from: 0, to: 1, type: "fade",
                },
            },
            closeOnClick: true,
            displayTime: 10000,
            message: content,
            // position: {
            //     at: "bottom right",
            //     my: "bottom right",
            //     offset: "20 20"
            // },
            title: title,
            type: type || "info",
            width: "auto",
        }, {
            direction: "up-stack",
            position: "bottom right"
        });
    }

    public static toastError(message: RestError | string, title?: string): void {
        this.toast(message, title, "error");
    }

    public static toastSuccess(message: RestError | string, title?: string): void {
        this.toast(message, title, "success");
    }

    public static toastWarning(message: RestError | string, title?: string): void {
        this.toast(message, title, "warning");
    }

    public static uuidv4(): string {
        return uuid.v4();
    }

    public static warning(message?: string, title?: string): Promise<boolean> {
        this.hideLoading();
        return new Promise((resolve) => {
            const d = dialog.custom({
                buttons: [{
                    onClick: function () {
                        resolve(true);
                        d.hide();
                    },
                    text: "Đồng ý"
                }],
                dragEnabled: false,
                messageHtml: message,
                title: title || "Cảnh báo"
            });
            $(".dx-dialog").dxPopup("instance").option({
                "maxWidth": "300px",
                "minWidth": "250px",
            });
            d.show();
        });
    }

    public static _isFileList(data): boolean {
        return data && data[0] && (data[0] instanceof File);
    }
}

export { OGUtils };