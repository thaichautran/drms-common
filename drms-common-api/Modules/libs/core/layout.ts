import "@mdi/font/css/materialdesignicons.css";
import axios from "axios";
import "bootstrap";
import "devextreme/dist/css/dx.common.css";
import "devextreme/dist/css/dx.light.css";
import "devextreme/integration/jquery";
import {
    loadMessages,
    locale
} from "devextreme/localization";
import dxForm from "devextreme/ui/form";
import "devextreme/ui/form";
import dxPopup from "devextreme/ui/popup";
import "devextreme/ui/popup";
import "devextreme/ui/toolbar";
import "devextreme/ui/tooltip";
import { getAnalytics } from "firebase/analytics";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { GetTokenOptions, deleteToken, getMessaging, getToken, onMessage } from "firebase/messaging";
import Handlebars from "handlebars";
import "iconsax-font-icon/dist/icons.css";
import "iconsax-font-icon/fantasticonrc.js";
import "jquery";
import moment from "moment";

import "../styles/scss/common.scss";
import "./common.js";
import { EnumStatus, INVALID_TOKEN_ERROR_CODE } from "./enums/enums";
import { OGUtils } from "./helpers/utils";
import "./layout.scss";
import "./library.js";
import viMessages from "./localization/vi.json";
import { RestError } from "./models/base-response.model";
import { OGConfigModel } from "./models/config.model";
import { UserDevicesToken } from "./models/notification.model";
import { ConfigService } from "./services/config.service";
import { HomeItemService } from "./services/hom-item.serivce";
import { NotificationService } from "./services/notification.service";

abstract class Layout {
    changeInfoForm: dxForm;
    changeInfoPopup: dxPopup;
    changePasswdForm: dxForm;
    changePasswdPopup: dxPopup;
    oGConfig: OGConfigModel;
    constructor(mode: string, title?: string) {
        if (mode === "top") {
            document.body.className += " format-top";
        } else if (mode === "child") {
            document.body.className += " format-child";
        } else if (mode === "map") {
            document.body.className += " format-map";
            if ($(document).width() > 500) {
                $("body").removeClass("fit-on");
            }
            $("#header").remove();
        } else if (mode === "login") {
            document.body.className += " format-login";
        } else if (mode === "home") {
            document.body.className += " format-home";
        }
        if (title) {
            $(".header-title > span").html(title);
        }
        //
        const self = this;
        const url = location.pathname.toLowerCase();
        //
        $(document).ajaxComplete(function (ev, xhr, settings) {
            if (xhr.status === 401) {
                OGUtils.error("Phiên sử dụng đã hết, vui lòng đăng nhập lại!").then(() => {
                    window.location.href = "/";
                });
            }
        });
        //

        $("#navigation ul.navbar-nav").find("li").removeClass("active");
        $("#navigation ul.navbar-nav").find("li > a").each(function () {
            let path = $(this).attr("href");
            if (path) {
                // url match condition         
                path = path.toLowerCase();
                if (path.length > 1 && url.length > 1 && url.substr(1, path.length - 1) == path.substr(1)) {
                    $(this).closest("li").addClass("active");
                    return;
                } else {
                    if (url === "/" && path === "/") {
                        $(this).closest("li").addClass("active");
                        return;
                    }
                }
            }
        });
        //
        $.each($(".map-navigations > ul > li > a"), (index, element) => {
            $("<div></div>").appendTo($("body")).dxTooltip({
                contentTemplate: (data) => {
                    data.html(`<span class="sidebar-tooltip-content">${$(element).attr("title")}</span>`);
                },
                hideEvent: "mouseleave",
                // hideOnOutsideClick: true,
                position: "top",
                showEvent: "mouseenter",
                target: $(element),
            });
        });
        //
        loadMessages(viMessages);
        locale("vi");
        //
        Handlebars.registerHelper("hasPermission", function (permission, options) {
            const conditional = self.oGConfig.hasPermission(permission);
            if (conditional) {
                return options.fn(this);
            } else {
                return options.inverse(this);
            }
        });

        Handlebars.registerHelper("canCreate", function (permission, options) {
            const conditional = self.oGConfig.canCreate(permission);
            if (conditional) {
                return options.fn(this);
            } else {
                return options.inverse(this);
            }
        });

        Handlebars.registerHelper("canUpdate", function (permission, options) {
            const conditional = self.oGConfig.canUpdate(permission);
            if (conditional) {
                return options.fn(this);
            } else {
                return options.inverse(this);
            }
        });

        Handlebars.registerHelper("canDelete", function (permission, options) {
            const conditional = self.oGConfig.canDelete(permission);
            if (conditional) {
                return options.fn(this);
            } else {
                return options.inverse(this);
            }
        });

        Handlebars.registerHelper("canNotify", function () {
            console.log(self.oGConfig.canNotify());
            return self.oGConfig.canNotify();
        });

        Handlebars.registerHelper("isdefined", function (value) {
            return value !== undefined;
        });

        Handlebars.registerHelper("toLocalTimeString", (date) => {
            return moment(date).format("HH:mm");
        });

        Handlebars.registerHelper("toLocalDateString", (date) => {
            if (date != null) {
                return moment(date).format("DD/MM/YYYY");
            } else {
                return "";
            }
        });

        Handlebars.registerHelper("ifCond", function (v1, operator, v2, options) {
            switch (operator) {
                case "==":
                    return (v1 == v2) ? options.fn(this) : options.inverse(this);
                case "===":
                    return (v1 === v2) ? options.fn(this) : options.inverse(this);
                case "!==":
                    return (v1 !== v2) ? options.fn(this) : options.inverse(this);
                case "<":
                    return (v1 < v2) ? options.fn(this) : options.inverse(this);
                case "<=":
                    return (v1 <= v2) ? options.fn(this) : options.inverse(this);
                case ">":
                    return (v1 > v2) ? options.fn(this) : options.inverse(this);
                case ">=":
                    return (v1 >= v2) ? options.fn(this) : options.inverse(this);
                case "&&":
                    return (v1 && v2) ? options.fn(this) : options.inverse(this);
                case "||":
                    return (v1 || v2) ? options.fn(this) : options.inverse(this);
                case "contains":
                    return (v1.includes(v2)) ? options.fn(this) : options.inverse(this);
                default:
                    return options.inverse(this);
            }
        });

        Handlebars.registerHelper("increment", function (value, step) {
            return parseInt(value) + (step || 1);
        });

        Handlebars.registerHelper("multiply", function (value, step) {
            return parseInt(value) * (step || 1);
        });

        Handlebars.registerHelper("distanceFixed", function (distance) {
            return OGUtils.formatNumber(distance, 0);
        });

        Handlebars.registerHelper("numberFixed", function (number) {
            return number.toFixed(2);
        });

        Handlebars.registerHelper("formatNumber", function (number) {
            return OGUtils.formatNumber(parseFloat(number.toString()), 0, 2);
        });

        this.initFirebase();

        this.fetchGuestToken().then(() => {
            $.ajaxSetup({
                headers: {
                    "x-guest-token": localStorage.getItem("GUEST_TOKEN"),
                    // "x-lang-code": Cookies.get('lang') || 'vi'
                }
            });

            axios.defaults.headers.common = {
                "x-guest-token": localStorage.getItem("GUEST_TOKEN"),
            };
        });

        ConfigService.get().then(configs => {
            this.oGConfig = new OGConfigModel();
            Object.assign(this.oGConfig, configs);
            $("body").removeClass("unload");

            HomeItemService.getByUrl(window.location.pathname + window.location.search).then(result => {
                if (result) {
                    $(".parent-module").text(result.name);
                }
            });

            if (this.onInit) {
                this.onInit();
            }
            this._initPopup();
            this._bindEvents();
        });
    }

    private _bindEvents(): void {
        $(document).on("click", ".change-password-action", () => {
            this.changePasswdPopup.show();
        });
        $(document).on("click", ".change-info-action", () => {
            $.ajax({
                type: "get",
                url: "/account/info",
            }).done(xhr => {
                if (xhr.status === EnumStatus.OK) {
                    this.changeInfoForm.option("formData", xhr.data);
                    this.changeInfoPopup.show();
                } else {
                    if (xhr.errors && xhr.errors.length > 0) {
                        OGUtils.alert(xhr.errors[0].message);
                    } else {
                        OGUtils.alert("Đổi thông tin tài khoản thất bại!");
                    }
                }
            });
        });
    }

    private _initHomeButton(url): void {
        let href = "/main/dashboard";
        if (url) {
            href = url;
        }
        $("#header").find("#nav-control-sp #btn-nav-sp").remove();
        $("#header").find("#nav-control-sp").append(`
            <li>
                <a title="Quay lại trang chủ" href="${href}">
                <img src="/assets/images/front/home_png.png" alt="" width="80" height="80">
                </a>
            </li>`);
    }

    private _initPopup(): void {
        const self = this;
        this.changePasswdPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (element: HTMLElement) => {
                this.changePasswdForm = $("<div></div>").appendTo($(element)).dxForm({
                    colCount: 1,
                    formData: {},
                    items: [{
                        dataField: "OldPasswd",
                        editorOptions: {
                            buttons: [{
                                location: "after",
                                name: "OldPasswd",
                                options: {
                                    icon: "eyeopen",
                                    onClick() {
                                        self.changePasswdForm.getEditor("OldPasswd").option("mode", self.changePasswdForm.getEditor("OldPasswd").option("mode") === "text" ? "password" : "text");
                                    },
                                    stylingMode: "text",
                                },
                            }],
                            mode: "password",
                        },
                        label: {
                            text: "Mật khẩu cũ",
                        },
                        validationRules: [{
                            message: "Vui lòng nhập mật khẩu",
                            type: "required"
                        }, {
                            message: "Mật khẩu có ít nhất 8 kí tự",
                            min: 8,
                            type: "stringLength",
                        },
                        {
                            message: "Mật khẩu cần ít nhất một ký tự viết hoa!",
                            type: "custom",
                            validationCallback: ({ value }) => {
                                const upperCaseLetters = /[A-Z]/g;
                                return value.match(upperCaseLetters);
                            },
                        },
                        {
                            message: "Mật khẩu cần ít nhất một ký tự thường!",
                            type: "custom",
                            validationCallback: ({ value }) => {
                                const lowerCaseLetters = /[a-z]/g;
                                return value.match(lowerCaseLetters);
                            },
                        },
                        {
                            message: "Mật khẩu không bao gồm dấu cách!",
                            type: "custom",
                            validationCallback: ({ value }) => {
                                return value.indexOf(" ") === -1;
                            },
                        },
                        {
                            message: "Ký tự đầu phải là chữ cái hoặc số!",
                            type: "custom",
                            validationCallback: ({ value }) => {
                                const lowerCaseLetters = /[a-z]/g;
                                const numbers = /[0-9]/g;
                                return value[0].toLowerCase().match(lowerCaseLetters) || value[0].toLowerCase().match(numbers);
                            },
                        },
                        {
                            message: "Mật khẩu cần ít nhất một số!",
                            type: "custom",
                            validationCallback: ({ value }) => {
                                const numbers = /[0-9]/g;
                                return value.match(numbers);
                            },
                        },
                        {
                            message: "Mật khẩu cần ít nhất một ký tự đặc biệt " + /[!@#$%^&*()|<>]/g,
                            type: "custom",
                            validationCallback: ({ value }) => {
                                const specialChars = /[!@#$%^&*()|<>]/g;
                                return value.match(specialChars);
                            },
                        },]
                    }, {
                        dataField: "NewPasswd",
                        editorOptions: {
                            buttons: [{
                                location: "after",
                                name: "NewPasswd",
                                options: {
                                    icon: "eyeopen",
                                    onClick() {
                                        self.changePasswdForm.getEditor("NewPasswd").option("mode", self.changePasswdForm.getEditor("NewPasswd").option("mode") === "text" ? "password" : "text");
                                    },
                                    stylingMode: "text",
                                },
                            }],
                            mode: "password",
                        },
                        label: {
                            text: "Mật khẩu mới",
                        },
                        validationRules: [{
                            message: "Vui lòng nhập mật khẩu",
                            type: "required"
                        }, {
                            message: "Mật khẩu có ít nhất 8 kí tự",
                            min: 8,
                            type: "stringLength",
                        },
                        {
                            message: "Mật khẩu cần ít nhất một ký tự viết hoa!",
                            type: "custom",
                            validationCallback: ({ value }) => {
                                const upperCaseLetters = /[A-Z]/g;
                                return value.match(upperCaseLetters);
                            },
                        },
                        {
                            message: "Mật khẩu cần ít nhất một ký tự thường!",
                            type: "custom",
                            validationCallback: ({ value }) => {
                                const lowerCaseLetters = /[a-z]/g;
                                return value.match(lowerCaseLetters);
                            },
                        },
                        {
                            message: "Mật khẩu không bao gồm dấu cách!",
                            type: "custom",
                            validationCallback: ({ value }) => {
                                return value.indexOf(" ") === -1;
                            },
                        },
                        {
                            message: "Ký tự đầu phải là chữ cái hoặc số!",
                            type: "custom",
                            validationCallback: ({ value }) => {
                                const lowerCaseLetters = /[a-z]/g;
                                const numbers = /[0-9]/g;
                                return value[0].toLowerCase().match(lowerCaseLetters) || value[0].toLowerCase().match(numbers);
                            },
                        },
                        {
                            message: "Mật khẩu cần ít nhất một số!",
                            type: "custom",
                            validationCallback: ({ value }) => {
                                const numbers = /[0-9]/g;
                                return value.match(numbers);
                            },
                        },
                        {
                            message: "Mật khẩu cần ít nhất một ký tự đặc biệt " + /[!@#$%^&*()|<>]/g,
                            type: "custom",
                            validationCallback: ({ value }) => {
                                const specialChars = /[!@#$%^&*()|<>]/g;
                                return value.match(specialChars);
                            },
                        },]
                    }, {
                        dataField: "ConfirmNewPasswd",
                        editorOptions: {
                            mode: "password",
                        },
                        label: {
                            text: "Xác nhận mật khẩu mới",
                        },
                        validationRules: [{
                            message: "Vui lòng nhập xác nhận mật khẩu",
                            type: "required"
                        }, {
                            message: "Mật khẩu không trùng khớp",
                            type: "custom",
                            validationCallback: (e) => {
                                return this.changePasswdForm.option("formData").NewPasswd === e.value;
                            }
                        }]
                    }, {
                        template: (itemData, itemElement) => {
                            $("<div />").appendTo(itemElement)
                                .dxToolbar({
                                    items: [
                                        {
                                            location: "center",
                                            options: {
                                                onClick: () => {
                                                    const validate = this.changePasswdForm.validate();
                                                    if (validate && validate.brokenRules.length === 0) {
                                                        const data = this.changePasswdForm.option("formData");
                                                        $.ajax({
                                                            contentType: "application/json",
                                                            data: JSON.stringify(data),
                                                            type: "post",
                                                            url: "/account/change-password"
                                                        }).done(xhr => {
                                                            if (xhr.Succeeded) {
                                                                this.changePasswdPopup.hide();
                                                                OGUtils.alert("Đổi mật khẩu thành công!").then(() => {
                                                                    this.changePasswdForm.resetValues();
                                                                });
                                                            } else {
                                                                this.changePasswdPopup.hide();
                                                                if (xhr.Errors && xhr.Errors.length > 0) {
                                                                    OGUtils.alert(xhr.Errors[0].Description).then(() => {
                                                                        this.changePasswdPopup.show();
                                                                    });
                                                                } else {
                                                                    OGUtils.alert("Đổi mật khẩu thất bại!").then(() => {
                                                                        this.changePasswdPopup.show();
                                                                    });
                                                                }

                                                            }
                                                        });
                                                    }
                                                },
                                                stylingMode: "contained",
                                                text: "Lưu",
                                                type: "default"
                                            },
                                            widget: "dxButton"
                                        }, {
                                            location: "center",
                                            options: {
                                                onClick: () => {
                                                    this.changePasswdForm.resetValues();
                                                    this.changePasswdPopup.hide();
                                                },
                                                stylingMode: "contained",
                                                text: "Hủy",
                                                type: "danger"
                                            },
                                            widget: "dxButton"
                                        }]
                                }).dxToolbar("instance");
                        }
                    }],
                    labelLocation: "left",
                    minColWidth: 300,
                    showColonAfterLabel: true,
                    width: "100%",
                }).dxForm("instance");
            },
            deferRendering: false,
            dragEnabled: true,
            height: "auto",
            hideOnOutsideClick: false,
            onHidden: () => {
            },
            onShown: () => {
            },
            shading: false,
            showCloseButton: false,
            showTitle: true,
            title: "Đổi mật khẩu",
            visible: false,
            width: 400,

        }).dxPopup("instance");
        this.changeInfoPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (element) => {
                this.changeInfoForm = $("<form></form>").appendTo(element).dxForm({
                    colCount: 1,
                    formData: {
                    },
                    items: [{
                        dataField: "user_name",
                        editorOptions: {
                            disabled: true,
                        },
                        label: {
                            text: "Tên đăng nhập"
                        },
                        visible: true
                    }, {
                        dataField: "email",
                        label: {
                            text: "Email",
                        },
                        validationRules: [{
                            message: "Vui lòng nhập email",
                            type: "required"
                        }, {
                            message: "Vui lòng nhập đúng định dạng email",
                            type: "email"
                        }],
                    },
                    {
                        dataField: "user_info.full_name",
                        label: {
                            text: "Tên đầy đủ"
                        },
                        validationRules: [{
                            message: "Vui lòng nhập email",
                            type: "required"
                        }, {
                            max: 256,
                            message: "Không nhập quá 256 ký tự",
                            type: "stringLength"
                        }, {
                            message: "Không được nhập giá trị có chưa mã nguồn",
                            type: "custom",
                            validationCallback: (e) => {
                                return !OGUtils.hasHtmlTag(e.value);
                            }
                        }, {
                            message: "Không được nhập giá trị có kí tự đặc biệt",
                            type: "custom",
                            validationCallback: (e) => {
                                return !OGUtils.hasSpecialChar(e.value);
                            }
                        },],
                        visible: true,
                    }, {
                        dataField: "phone_number",
                        label: {
                            text: "Số điện thoại",
                        },
                        validationRules: [{
                            message: "Vui lòng nhập số điện thoại",
                            type: "required"
                        }, {
                            message: "Vui lòng nhập số điện thoại",
                            type: "required"
                        }],
                    }, {
                        dataField: "user_info.unit",
                        label: {
                            text: "Đơn vị công tác"
                        },
                        validationRules: [{
                            max: 256,
                            message: "Không nhập quá 256 ký tự",
                            type: "stringLength"
                        }, {
                            message: "Không được nhập giá trị có chưa mã nguồn",
                            type: "custom",
                            validationCallback: (e) => {
                                return !OGUtils.hasHtmlTag(e.value);
                            }
                        },],
                        visible: true,
                    }, {
                        dataField: "user_info.position",
                        label: {
                            text: "Chức vụ"
                        },
                        validationRules: [{
                            max: 256,
                            message: "Không nhập quá 256 ký tự",
                            type: "stringLength"
                        }, {
                            message: "Không được nhập giá trị có chưa mã nguồn",
                            type: "custom",
                            validationCallback: (e) => {
                                return !OGUtils.hasHtmlTag(e.value);
                            }
                        },],
                        visible: true,
                    }, {
                        template: (itemData, itemElement) => {
                            $("<div />").appendTo(itemElement)
                                .dxToolbar({
                                    items: [
                                        {
                                            location: "center",
                                            options: {
                                                onClick: () => {
                                                    const validate = this.changeInfoForm.validate();
                                                    if (validate && validate.brokenRules.length === 0) {
                                                        const data = this.changeInfoForm.option("formData");
                                                        const dataFormat = {
                                                            Email: data.email,
                                                            FullName: data.user_info.full_name,
                                                            Notification: data.notification,
                                                            PhoneNumber: data.phone_number,
                                                            Position: data.user_info.position,
                                                            Unit: data.user_info.unit,
                                                            UserId: data.id,
                                                            UserName: data.user_name
                                                        };
                                                        $.ajax({
                                                            contentType: "application/json",
                                                            data: JSON.stringify(dataFormat),
                                                            type: "post",
                                                            url: "/api/user/update"
                                                        }).done(xhr => {
                                                            if (xhr.status === EnumStatus.OK) {
                                                                this.changeInfoPopup.hide();
                                                                OGUtils.alert("Đổi thông tin thành công!").then(() => {
                                                                    // $('.acount-username').text("Xin chào " + this.changeInfoForm.option('formData').full_name);
                                                                    this.changeInfoForm.resetValues();
                                                                });
                                                            } else {
                                                                this.changeInfoPopup.hide();
                                                                if (xhr.errors && xhr.errors.length > 0) {
                                                                    OGUtils.alert(xhr.errors[0].message).then(() => {
                                                                        this.changeInfoPopup.show();
                                                                    });
                                                                } else {
                                                                    OGUtils.alert("Đổi thông tin thất bại!").then(() => {
                                                                        this.changeInfoPopup.show();
                                                                    });
                                                                }

                                                            }
                                                        });
                                                    }
                                                },
                                                stylingMode: "contained",
                                                text: "Lưu",
                                                type: "default"
                                            },
                                            widget: "dxButton"
                                        }, {
                                            location: "center",
                                            options: {
                                                onClick: () => {
                                                    this.changeInfoForm.resetValues();
                                                    this.changeInfoPopup.hide();
                                                },
                                                stylingMode: "contained",
                                                text: "Hủy",
                                                type: "danger"
                                            },
                                            widget: "dxButton"
                                        }]
                                }).dxToolbar("instance");
                        }
                    }],
                    labelLocation: "left",
                    minColWidth: 300,
                    showColonAfterLabel: true,
                    width: "100%",
                }).dxForm("instance");
            },
            deferRendering: false,
            dragEnabled: true,
            height: "auto",
            hideOnOutsideClick: false,
            onHidden: () => {
            },
            onShown: () => {
            },
            shading: false,
            showCloseButton: false,
            showTitle: true,
            title: "Đổi thông tin tài khoản",
            visible: false,
            width: 400,

        }).dxPopup("instance");
    }
    private _initUserName(): void {
        $.ajax({
            type: "get",
            url: "/Account/Info",
        }).done(xhr => {
            let full_name = "";
            if (xhr.status === EnumStatus.OK) {
                full_name = xhr.data.full_name;
            }
            $(".acount-username").text("Xin chào " + full_name);
        });
    }
    private fetchGuestToken(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if (!localStorage.getItem("GUEST_TOKEN")) {
                $.ajax({
                    contentType: "application/json",
                    data: JSON.stringify({ grant_type: "guest" }),
                    type: "POST",
                    url: "/api/token"
                }).done(xhr => {
                    if (xhr.status === "OK") {
                        localStorage.setItem("GUEST_TOKEN", xhr.data.guest_token);
                    }
                    resolve(localStorage.getItem("GUEST_TOKEN"));
                });
            } else {
                resolve(localStorage.getItem("GUEST_TOKEN"));
            }
        });
    }
    private async initFirebase(): Promise<void> {
        // Your web app's Firebase configuration
        // For Firebase JS SDK v7.20.0 and later, measurementId is optional
        const app_key = "BK2FheSh89uPkiUDPbWmw7gfETR9F9i6XW5G68p_yBfYdwH5Du8XQG7ndZy5xri7uGJWTnFekot54wbHFDVTNH4";
        const firebaseConfig = {
            apiKey: "AIzaSyCmZfmTHP9BSffgB6jbLpQChrNidxS6uDs",
            appId: "1:247256197770:web:0a11bd1c8f55ecde29db73",
            authDomain: "opengis-27f76.firebaseapp.com",
            measurementId: "G-FGCGT4PC2V",
            messagingSenderId: "247256197770",
            projectId: "opengis-27f76",
            storageBucket: "opengis-27f76.firebasestorage.app"
        };
        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        const analytics = getAnalytics(app);
        const messaging = getMessaging(app);
        //onMessage can return payload
        onMessage(messaging, (payload) => {
            NotificationService.unread().then(xhr => {
                if (xhr.status === EnumStatus.OK) {
                    if (xhr.data > 0) {
                        $(document).find("span.unread-noti-info").text(`(Có ${xhr.data} thông báo mới)`);
                        $(document).find("span.unread-noti-info").show();
                        $(document).find("span.notification-icon").show();
                    }
                    else {
                        $(document).find("span.unread-noti-info").hide();
                        $(document).find("span.notification-icon").hide();
                    }
                }
            });
        });

        // onBackgroundMessage(messaging, (payload) => {
        //     console.log(payload);
        // });

        async function registrationToken(): Promise<void> {
            getToken(messaging, { vapidKey: app_key }).then(async (currentToken) => {
                if (currentToken) {
                    const item: UserDevicesToken = {
                        device_name: "website_device",
                        device_token: currentToken,
                        platform: "website",
                    };
                    NotificationService.device(item).then(result => {
                        if (result.status === EnumStatus.OK) {
                            //
                        }
                        else {
                            if ((result as RestError).errors.length) {
                                if ((result as RestError).errors[0].code !== INVALID_TOKEN_ERROR_CODE) {
                                    deleteToken(messaging).then(() => {
                                        registrationToken();
                                        requestPermission();
                                    });
                                }
                                else {
                                    console.log((result as RestError).errors[0].message);
                                }
                            }
                        }
                    });
                }
            });
        }

        function requestPermission(): void {
            Notification.requestPermission().then(function (getperm) {
                console.log("Perm granted", getperm);
            });
        }
        // function deleteTokenFromFirebase(): void {
        //     getToken(messaging, { vapidKey: app_key }).then(async (currentToken) => {
        //         if (currentToken) {
        //             deleteToken(messaging).then(() => {
        //                 registrationToken();
        //                 requestPermission();
        //             });
        //         }
        //     });
        // }

        //Call registrationToken
        registrationToken();

        //Permission
        requestPermission();

        //delete token
        //deleteTokenFromFirebase();
    }

    public get config(): OGConfigModel {
        return this.oGConfig;
    }

    protected abstract onInit(): void;
}

export { Layout };