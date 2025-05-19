import axios, { AxiosError, AxiosResponse } from "axios";
import "devextreme/ui/check_box";
import "devextreme/ui/form";
import dxForm from "devextreme/ui/form";
import "devextreme/ui/text_box";

import { RazorView } from "../../../../../../libs/core/decorators/razor-view.decorator";
import { EnumStatus } from "../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../libs/core/helpers/utils";
import { Layout } from "../../../../../../libs/core/layout";
import { RestData, RestError } from "../../../../../../libs/core/models/base-response.model";
import "./login.view.scss";

@RazorView()
class LoginView extends Layout {
    forgotPasswordForm: dxForm;
    loginForm: dxForm;
    constructor() {
        super("login");
    }

    private bindEvents(): void {
        $("#forgot-password").on("click", function () {
            $(".popup-login-content").prop("hidden", true);
            $(".popup-forgot-password-content").prop("hidden", false);
        });
        $("#back-to-login").on("click", function () {
            $(".popup-login-content").prop("hidden", false);
            $(".popup-forgot-password-content").prop("hidden", true);
        });
    }

    private doLogin(): void {
        if (this.loginForm.validate().isValid) {
            OGUtils.showLoading();
            const loginData = this.loginForm.option("formData");
            axios.post("/account/login", loginData).then((response: AxiosResponse<RestData<object> | RestError>) => {
                if (response.status === 200) {
                    if (response.data.status === EnumStatus.OK) {
                        window.location.replace(OGUtils.getUrlParams("returnUrl") || (response.data as RestData<object>).data["returnUrl"] || "/");
                    } else {
                        OGUtils.alert(response.data as RestError);
                    }
                }
            }).catch((error: AxiosError<RestError>) => {
                if (error.response && error.response.data) {
                    OGUtils.alert(error.response.data);
                }
            }).finally(() => {
                OGUtils.hideLoading();
            });
        }
    }

    protected onInit(): void {
        this.loginForm = $("#form-login .popup-login-content").dxForm({
            formData: {
                password: "",
                username: "",
            },
            items: [{
                dataField: "__RequestVerificationToken",
                visible: false,
            }, {
                dataField: "username",
                editorOptions: {
                    onEnterKey: () => {
                        this.doLogin();
                    },
                    placeholder: "Nhập tài khoản",
                    showClearButton: true,
                },
                editorType: "dxTextBox",
                label: {
                    text: "Tài khoản"
                },
                validationRules: [{
                    message: "Vui lòng nhập tài khoản",
                    type: "required"
                }]
            }, {
                dataField: "password",
                editorOptions: {
                    mode: "password",
                    onEnterKey: () => {
                        this.doLogin();
                    },
                    placeholder: "Nhập mật khẩu",
                    showClearButton: true,
                },
                editorType: "dxTextBox",
                label: {
                    text: "Mật khẩu"
                },
                validationRules: [{
                    message: "Vui lòng nhập mật khẩu",
                    type: "required"
                }]
            }, {
                colCount: 2,
                itemType: "group",
                items: [{
                    dataField: "rememberMe",
                    editorType: "dxCheckBox",
                    label: {
                        showColon: false,
                        text: "Ghi nhớ?",
                    },
                }, {
                    // label: {
                    //     showColon: false,
                    //     text: "Quên mật khẩu?",
                    // },
                    template: (data, element) => {
                        element.append("<a href=\"javascript:;\" id=\"forgot-password\" class=\"text-muted text-hover-primary\" >Quên mật khẩu?</a>");
                    }
                }]
            }, {
                buttonOptions: {
                    icon: "icon icon-login",
                    onClick: () => {
                        this.doLogin();
                    },
                    text: "Đăng nhập",
                    type: "success",
                },
                cssClass: "popup-login-button font-weight-bold",
                itemType: "button"
            }, {
                template: () => {
                    return "<hr />";
                }
            }, {
                buttonOptions: {
                    icon: "icon icon-camera",
                    onClick: () => {
                        window.open("https://14.225.68.226:8029", "_blank");
                    },
                    text: "Hệ thống quản lý mục tiêu di động",
                    type: "danger",
                },
                cssClass: "popup-login-button font-weight-bold",
                itemType: "button",
            }],
            labelLocation: "top"
        }).dxForm("instance");

        this.forgotPasswordForm = $("#form-login .popup-forgot-password-content").dxForm({
            formData: {
                __RequestVerificationToken: $("[name=__RequestVerificationToken]").val(),
                email: "",
            },
            items: [{
                dataField: "__RequestVerificationToken",
                visible: false,
            }, {
                dataField: "email",
                editorOptions: {
                    onEnterKey: () => {
                        if (this.forgotPasswordForm.validate().isValid) {
                            this.forgotPasswordForm.element().trigger("submit");
                        }
                    },
                    placeholder: "abc@gmail.com",
                    showClearButton: true,
                },
                editorType: "dxTextBox",
                label: {
                    text: "Nhập email để khôi phục mật khẩu"
                },
                validationRules: [{
                    message: "Vui lòng nhập email",
                    type: "required"
                }, {
                    message: "Vui lòng nhập đúng định dạng email",
                    type: "email",
                }]
            }, {
                buttonOptions: {
                    onClick: () => {
                        if (this.forgotPasswordForm.validate().isValid) {
                            this.forgotPasswordForm.element().trigger("submit");
                        }
                    },
                    text: "Lấy lại mật khẩu",
                    type: "success",
                },
                cssClass: "popup-login-button",
                itemType: "button"
            }, {
                template: (data, element) => {
                    element.append("<a href=\"javascript:;\" id=\"back-to-login\" class=\"text-muted text-hover-primary\" >Đăng nhập trở lại?</a>");
                }
            }],
            labelLocation: "top"
        }).dxForm("instance");
        $("[name=__RequestVerificationToken]").appendTo($(".popup-forgot-password-content"));
        this.bindEvents();
    }
}