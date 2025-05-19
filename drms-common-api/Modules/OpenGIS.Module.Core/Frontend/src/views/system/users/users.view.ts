import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import dxDataGrid from "devextreme/ui/data_grid";
import "devextreme/ui/data_grid";
import dxForm from "devextreme/ui/form";
import "devextreme/ui/form";
import dxMultiView from "devextreme/ui/multi_view";
import dxPopup from "devextreme/ui/popup";
import "devextreme/ui/popup";
import dxTabPanel from "devextreme/ui/tab_panel";
import "devextreme/ui/tab_panel";
import dxToolbar from "devextreme/ui/toolbar";
import "devextreme/ui/toolbar";
import dxTreeView from "devextreme/ui/tree_view";
import "devextreme/ui/tree_view";
import Handlebars from "handlebars";

import { SwitchModuleWindowComponent } from "../../../../../../libs/core/components/switch-module-window/switch-module-window.component";
import { RazorView } from "../../../../../../libs/core/decorators/razor-view.decorator";
import { EnumStatus } from "../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../libs/core/helpers/utils";
import { Layout } from "../../../../../../libs/core/layout";
import { UserAuditView } from "./user-audit/user-audit.view";
import "./users.view.scss";
import { UserGridView } from "./users-grid/user-grid";

const RolesPopup_Type = {
    ForGroup: 2,
    ForPermissionGroup: 3,
    ForUser: 1
};

@RazorView()
class UserView extends Layout {
    changePasswordForm: dxForm;
    changePasswordPopup: dxPopup;
    foldersTree: dxTreeView;
    layerPermissionTree: dxTreeView;
    moveUserForm: dxForm;
    moveUserPopup: dxPopup;
    permissionGroupContainer: JQuery<HTMLElement>;
    permissionGroupForm: dxForm;
    permissionGroupGrid: dxDataGrid;
    permissionGroupPopup: dxPopup;
    permissionGroupStore: CustomStore;
    permissionRoleTree: dxTreeView;
    regionRoleTree: dxTreeView;
    roleGrid: dxDataGrid;
    rolePopup: dxPopup;
    roleStore: CustomStore;
    roleTab: dxTabPanel;
    roleToolbar: dxToolbar;
    selectedUserGroupID: string;
    switchModule: SwitchModuleWindowComponent;
    userAuditContainer: JQuery<HTMLElement>;
    userContainer: JQuery<HTMLElement>;
    userGrid: dxDataGrid;
    userGridView: UserGridView;
    userGroupContainer: JQuery<HTMLElement>;
    userGroupGrid: dxDataGrid;
    userGroupInfoForm: dxForm;
    userGroupInfoPopup: dxPopup;
    userGroupStore: CustomStore;
    userGroupView: dxMultiView;
    userInfoForm: dxForm;
    userInfoPopup: dxPopup;
    userRoleTree: dxTreeView;
    userStore: CustomStore;
    constructor() {
        super("child");
    }

    private bindEvents(): void {
        const self = this;
        $(document).on("click", ".switch-module-action", function () {
            self.switchModule.showPopup();
        });
    }

    private initFoldersTree(container): void {
        container = container.css("padding", "10px").css("height", "100%");

        this.foldersTree = $("<div />").appendTo(container)
            .dxTreeView({
                dataSource: {},
                searchEnabled: true,
                showCheckBoxesMode: "normal",
            }).dxTreeView("instance");
    }

    private initLayerRoleTree(container): void {
        container = container.css("padding", "10px");

        this.layerPermissionTree = $("<div />").appendTo(container)
            .dxTreeView({
                dataSource: {},
                searchEnabled: true,
                showCheckBoxesMode: "normal",
            }).dxTreeView("instance");
    }

    private initLayout(): void {
        const self = this;
        let selectedRole = null;
        this.switchModule = new SwitchModuleWindowComponent("table");
        //Popup đổi mật khẩu người dùng
        this.changePasswordPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.changePasswordForm = $("<div />").appendTo(container)
                    .dxForm({
                        formData: {},
                        items: [{
                            dataField: "newPasswd",
                            editorOptions: {
                                mode: "password",
                            },
                            label: {
                                text: "Mật khẩu",
                            },
                            validationRules: [{
                                message: "Vui lòng nhập mật khẩu",
                                type: "required",
                            },]
                        }, {
                            dataField: "confirmNewPasswd",
                            editorOptions: {
                                mode: "password",
                            },
                            label: {
                                text: "Xác nhận mật khẩu",
                            },
                            validationRules: [{
                                message: "Vui lòng nhập xác nhận mật khẩu",
                                type: "required"
                            }, {
                                message: "Mật khẩu không trùng khớp",
                                type: "custom",
                                validationCallback: (e) => {
                                    return this.changePasswordForm.option("formData").newPasswd === e.value;
                                }
                            }]
                        }, {
                            template: () => {
                                return "<hr style=\"margin: 5px 0;\" />";
                            }
                        }, {
                            colSpan: 2,
                            template: (itemData, itemElement) => {
                                $("<div />").appendTo(itemElement)
                                    .dxToolbar({
                                        items: [{
                                            location: "center",
                                            options: {
                                                onClick: () => {

                                                    const validate = this.changePasswordForm.validate();
                                                    if (validate && validate.brokenRules.length === 0) {
                                                        OGUtils.showLoading();

                                                        const data = this.changePasswordForm.option("formData");
                                                        data.userName = this.userGrid.option("userName");

                                                        $.ajax({
                                                            contentType: "application/json",
                                                            data: JSON.stringify(data),
                                                            type: "post",
                                                            url: "/api/user/changePassword"
                                                        }).done(xhr => {
                                                            OGUtils.hideLoading();
                                                            if (xhr.status === EnumStatus.OK) {
                                                                OGUtils.alert("Đổi mật khẩu thành công!").then(() => {
                                                                    this.changePasswordForm.resetValues();
                                                                    this.changePasswordPopup.hide();
                                                                });
                                                            } else {
                                                                if (xhr.errors && xhr.errors.length > 0) {
                                                                    OGUtils.alert(xhr.errors[0].message);
                                                                } else {
                                                                    OGUtils.alert("Đổi mật khẩu thất bại!");
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
                                                    this.changePasswordForm.resetValues();
                                                    this.changePasswordPopup.hide();
                                                },
                                                stylingMode: "contained",
                                                text: "Hủy",
                                                type: "danger"
                                            },
                                            widget: "dxButton"
                                        }]
                                    }).dxToolbar("instance");
                            }

                        }]
                    }).dxForm("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: "auto",
            hideOnOutsideClick: false,
            onOptionChanged: () => {

            },
            resizeEnabled: false,
            shading: true,
            showCloseButton: false,
            showTitle: true,
            title: "Đổi mật khẩu",
            width: "auto",
        }).dxPopup("instance");
        this.rolePopup = $("<div />").addClass("role-popup").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                container.css("padding", "0");
                this.roleTab = $("<div />").appendTo(container)
                    .dxTabPanel({
                        animationEnabled: false,
                        deferRendering: false,
                        height: 400,
                        itemTemplate: (itemData, itemIndex, itemElement) => {
                            const scrollView = $("<div />").appendTo(itemElement);
                            if (itemData.id === "layer") {
                                self.initLayerRoleTree(scrollView);
                            } else if (itemData.id === "functions") {
                                self.initPermissionRoleTree(scrollView);
                            } else if (itemData.id === "regions") {
                                self.initRegionRoleTree(scrollView);
                            } else if (itemData.id === "users") {
                                self.initUserRoleTree(scrollView);
                            } else if (itemData.id === "folders") {
                                self.initFoldersTree(scrollView);
                            }
                            scrollView.dxScrollView();
                        },
                        itemTitleTemplate: (itemData) => {
                            return itemData.text;
                        },
                        items: [{
                            id: "layer",
                            text: "Quyền sử dụng lớp dữ liệu"
                        }, {
                            id: "functions",
                            text: "Quyền sử dụng chức năng"
                        }, {
                            id: "regions",
                            text: "Quyền quản lý hành chính"
                        }, {
                            id: "users",
                            text: "Quyền quản lý tài khoản"
                        }, {
                            id: "folders",
                            text: "Quyền quản lý thư mục"
                        },],
                        loop: false,
                        onSelectionChanged: () => {

                        },
                        selectedIndex: 0,
                        swipeEnabled: false,
                        width: "auto"
                    }).dxTabPanel("instance");
                this.roleToolbar = $("<div />").height("70px").css("padding", "10px").css("border", "1px solid #ddd").appendTo(container)
                    .dxToolbar({
                        items: [{
                            location: "center",
                            template: function () {
                                return $("<div class='toolbar-label'><b>Quyền thao tác</b></div>");
                            }
                        }, {
                            location: "center",
                            options: {
                                displayExpr: "text",
                                items: [{
                                    id: "administrator",
                                    text: "Quản trị nhóm"
                                }, {
                                    id: "user",
                                    text: "Cán bộ"
                                }],
                                onInitialized: e => {
                                    selectedRole = e.component.option("value");
                                },
                                onSelectionChanged: (e) => {
                                    selectedRole = e.component.option("value");
                                },
                                valueExpr: "id"
                            },
                            widget: "dxSelectBox"
                        },]
                    }).dxToolbar("instance");

                setInterval(() => {
                    this.roleTab.element().height(container.height() - this.roleToolbar.element().outerHeight());
                }, 200);
            },
            deferRendering: false,
            dragEnabled: false,
            height: 600,
            hideOnOutsideClick: false,
            onOptionChanged: () => {

            },
            resizeEnabled: false,
            shading: true,
            showTitle: true,
            title: "Phân quyền",
            toolbarItems: [{
                location: "center",
                options: {
                    onClick: () => {
                        const layerRoles = [];
                        $.each(this.layerPermissionTree.getDataSource().items(), (idx, item) => {
                            if (item && item.items) {
                                $.each(item.items, (childIdx, child) => {
                                    if (child.selected && child.raw) {
                                        layerRoles.push(child.raw.id);
                                    }
                                });
                            }
                        });
                        const permissionRoles = [];
                        $.each(this.permissionRoleTree.getDataSource().items(), (idx, item) => {
                            if (item && item.items) {
                                let hasSelected = false;
                                $.each(item.items, (childIdx, child) => {
                                    if (child.selected && child.raw) {
                                        hasSelected = true;
                                        permissionRoles.push(child.raw.permission_value);
                                    }
                                });

                                if (hasSelected) {
                                    permissionRoles.push(item.raw.permission_value);
                                }
                            }
                        });
                        const folders = [];
                        if (this.foldersTree && this.foldersTree.getDataSource()) {
                            $.each(this.foldersTree.getDataSource().items(), (idx, item) => {
                                if (item && item.selected && item.raw) {
                                    folders.push(item.raw.id);
                                }
                            });
                        }

                        const userRoles = [];
                        const regionRoles = [];

                        switch (this.rolePopup["RolesPopup_Type"]) {
                            case RolesPopup_Type.ForUser:
                                $.each(this.regionRoleTree.getDataSource().items(), (idx, item) => {
                                    if (item.items) {
                                        let hasSelected = false;
                                        $.each(item.items, (childIdx, child) => {
                                            if (child.selected && child.raw) {
                                                hasSelected = true;
                                                regionRoles.push(child.raw.area_id);
                                            }
                                        });

                                        if (hasSelected) {
                                            regionRoles.push(item.raw.area_id);
                                        }
                                    }
                                });

                                OGUtils.showLoading();
                                $.when($.ajax({
                                    data: {
                                        id: this.layerPermissionTree["userId"],
                                        layers: layerRoles
                                    },
                                    type: "post",
                                    url: "/api/user/saveLayerRoles"
                                }), $.ajax({
                                    data: {
                                        id: this.permissionRoleTree["userId"],
                                        permissions: permissionRoles,
                                        role: selectedRole
                                    },
                                    type: "post",
                                    url: "/api/user/savePermissionRoles"
                                }), $.ajax({
                                    data: {
                                        id: this.regionRoleTree["userId"],
                                        regions: regionRoles
                                    },
                                    type: "post",
                                    url: "/api/user/saveRegionRoles"
                                }), $.ajax({
                                    data: {
                                        folders: folders,
                                        id: this.foldersTree["userId"]
                                    },
                                    type: "post",
                                    url: "/api/user/save-folders"
                                })).then(() => {
                                    OGUtils.hideLoading();
                                    this.userGrid.getDataSource().reload();
                                    this.rolePopup.hide();
                                    OGUtils.toastSuccess("Lưu thành công!");
                                });
                                break;
                            case RolesPopup_Type.ForGroup:
                                $.each(this.regionRoleTree.getDataSource().items(), (idx, item) => {
                                    if (item && item.items) {
                                        let hasSelected = false;
                                        $.each(item.items, (childIdx, child) => {
                                            if (child.selected && child.raw) {
                                                hasSelected = true;
                                                regionRoles.push(child.raw.area_id);
                                            }
                                        });

                                        if (hasSelected) {
                                            regionRoles.push(item.raw.area_id);
                                        }
                                    }
                                });

                                $.each(this.userRoleTree.getDataSource().items(), (idx, item) => {
                                    if (item && item.selected && item.raw) {
                                        userRoles.push(item.raw.id);
                                    }
                                });

                                OGUtils.showLoading();
                                $.when($.ajax({
                                    data: {
                                        id: this.layerPermissionTree["groupId"],
                                        layers: layerRoles
                                    },
                                    type: "post",
                                    url: "/api/group/saveLayerRoles"
                                }), $.ajax({
                                    data: {
                                        id: this.permissionRoleTree["groupId"],
                                        permissions: permissionRoles
                                    },
                                    type: "post",
                                    url: "/api/group/savePermissionRoles"
                                }), $.ajax({
                                    data: {
                                        id: this.regionRoleTree["groupId"],
                                        regions: regionRoles
                                    },
                                    type: "post",
                                    url: "/api/group/saveRegionRoles"
                                }), $.ajax({
                                    data: {
                                        id: this.userRoleTree["groupId"],
                                        users: userRoles
                                    },
                                    type: "post",
                                    url: "/api/group/saveUserRoles"
                                }).then(() => {
                                    OGUtils.hideLoading();
                                    this.userGroupGrid.getDataSource().reload();
                                    this.rolePopup.hide();
                                    OGUtils.toastSuccess("Lưu thành công!");
                                }),
                                    // $.ajax({
                                    //     data: {
                                    //         folders: folders,
                                    //         id: this.foldersTree["groupId"]
                                    //     },
                                    //     type: "post",
                                    //     url: "/api/group/save-folders"
                                    // })).then(() => {
                                    //     OGUtils.hideLoading();
                                    //     this.userGroupGrid.getDataSource().reload();
                                    //     this.rolePopup.hide();
                                    //     OGUtils.toastSuccess("Lưu thành công!");
                                    // }
                                );
                                break;
                            case RolesPopup_Type.ForPermissionGroup:
                                OGUtils.showLoading();
                                $.when($.ajax({
                                    data: {
                                        id: this.layerPermissionTree["permissionGroupId"],
                                        layers: layerRoles
                                    },
                                    type: "post",
                                    url: "/api/permission-group/saveLayerRoles"
                                }), $.ajax({
                                    data: {
                                        id: this.permissionRoleTree["permissionGroupId"],
                                        permissions: permissionRoles
                                    },
                                    type: "post",
                                    url: "/api/permission-group/savePermissionRoles"
                                })).then(() => {
                                    OGUtils.hideLoading();
                                    this.permissionGroupGrid.getDataSource().reload();
                                    this.rolePopup.hide();
                                    OGUtils.toastSuccess("Lưu thành công!");
                                });
                                break;
                            default:
                                OGUtils.alert("Lỗi! Thử lại sau");
                        }
                    },
                    text: "Lưu thiết lập",
                    type: "default"
                },
                toolbar: "bottom",
                widget: "dxButton",
            }, {
                location: "center",
                options: {
                    onClick: () => {
                        this.rolePopup.hide();
                    },
                    text: "Huỷ",
                    type: "danger"
                },
                toolbar: "bottom",
                widget: "dxButton"
            }],
            width: 400
        }).dxPopup("instance");
        this.userStore = new CustomStore({
            byKey: (key) => {
                const deferred = $.Deferred();
                $.get("/api/user/" + key.toString()).done(xhr => {
                    if (xhr && xhr.status === EnumStatus.OK) {
                        deferred.resolve(xhr.data);
                    }
                    deferred.resolve({});
                });
                return deferred;
            },
            insert: (values) => {
                return $.ajax({
                    contentType: "application/json",
                    data: JSON.stringify(values),
                    type: "post",
                    url: "/api/user/create",
                });
            },
            key: "id",
            load: (loadOptions) => {
                const deferred = $.Deferred(),
                    args: { [key: string]: number | string } = {};

                if (loadOptions.sort) {
                    args.orderby = loadOptions.sort[0].selector;
                    if (loadOptions.sort[0].desc)
                        args.orderby += " desc";
                }

                args.skip = loadOptions.skip ? loadOptions.skip : 0;
                args.take = loadOptions.take ? loadOptions.take : 50;
                if (!self.selectedUserGroupID) {
                    $.ajax({
                        error: () => {
                            deferred.reject("Data Loading Error");
                        },
                        success: (xhr) => {
                            deferred.resolve({
                                data: xhr.data,
                                totalCount: xhr.data.length
                            });
                        },
                        type: "get",
                        url: "/api/group/users",
                    });
                } else if (self.selectedUserGroupID === "Orphan") {
                    $.ajax({
                        error: () => {
                            deferred.reject("Data Loading Error");
                        },
                        success: (xhr) => {
                            deferred.resolve({
                                data: xhr.data,
                                totalCount: xhr.data.length
                            });
                        },
                        type: "get",
                        url: "/api/group/orphanUsers",
                    });
                } else {
                    $.ajax({
                        error: () => {
                            deferred.reject("Data Loading Error");
                        },
                        success: (xhr) => {
                            deferred.resolve({
                                data: xhr.data,
                                totalCount: xhr.data.length
                            });
                        },
                        type: "get",
                        url: "/api/group/" + self.selectedUserGroupID + "/users",
                    });
                }
                return deferred.promise();
            },
            remove: (key) => {
                return $.ajax({
                    data: {
                        UserId: key,
                    },
                    success: xhr => {
                        if (xhr.status === EnumStatus.OK) {
                            OGUtils.alert("Xóa người sử dụng thành công!");
                        } else {
                            OGUtils.error(xhr.errors[0].message);
                        }
                    },
                    type: "POST",
                    url: "/api/user/delete"
                });
            },
            update: (key, values) => {
                const data = {
                    DistrictId: values.user_info.district_code,
                    Email: values.email,
                    FullName: values.user_info.full_name,
                    Notification: values.notification,
                    PhoneNumber: values.phone_number,
                    Position: values.user_info.position,
                    SendApp: values.user_info.send_app,
                    SendMail: values.user_info.send_mail,
                    SendSms: values.user_info.send_sms,
                    Unit: values.user_info.unit,
                    UserId: values.id,
                    UserName: values.user_name
                };
                return $.ajax({
                    contentType: "application/json",
                    data: JSON.stringify(data),
                    success: xhr => {
                        if (xhr.status === EnumStatus.OK) {
                            OGUtils.alert("Cập nhật người sử dụng thành công!").then(() => {
                                this.userGrid.getDataSource().reload();
                                this.userInfoPopup.hide();
                            });
                        } else {
                            OGUtils.alert(xhr.errors[0].message);
                        }
                        // if (xhr.status === EnumStatus.OK) {
                        //     $.ajax({
                        //         contentType: "application/json",
                        //         data: JSON.stringify(data),
                        //         success: (xhr) => {
                        //             if (xhr.status === EnumStatus.OK) {
                        //                 OGUtils.alert("Cập nhật người sử dụng thành công!").then(() => {
                        //                     this.userGrid.getDataSource().reload();
                        //                     this.userInfoPopup.hide();
                        //                 });
                        //             } else {
                        //                 OGUtils.alert(xhr.errors[0].message);
                        //             }
                        //         },
                        //         type: "POST",
                        //         url: "/api/user/saveOrUpdateClaim",
                        //     });
                        // }
                    },
                    type: "POST",
                    url: "/api/user/update",
                });
            }
        });
        this.roleStore = new CustomStore({
            byKey: (key) => {
                const deferred = $.Deferred();
                $.get("/api/user/getRoles/" + key.toString()).done(xhr => {
                    if (xhr && xhr.status === EnumStatus.OK) {
                        deferred.resolve(xhr.data);
                    }
                    deferred.resolve({});
                });
                return deferred;
            },
            key: "id",
            load: () => {
                const deferred = $.Deferred();
                $.get("/api/user/getRoles").done(xhr => {
                    if (xhr && xhr.status === EnumStatus.OK) {
                        deferred.resolve(xhr.data);
                    }
                    deferred.resolve([]);
                });
                return deferred.promise();
            }
        });
        this.permissionGroupStore = new CustomStore({
            key: "id",
            load: (loadOptions) => {
                const deferred = $.Deferred(),
                    args: { [key: string]: number | string } = {};

                if (loadOptions.sort) {
                    args.orderby = loadOptions.sort[0].selector;
                    if (loadOptions.sort[0].desc)
                        args.orderby += " desc";
                }

                args.skip = loadOptions.skip ? loadOptions.skip : 0;
                args.take = loadOptions.take ? loadOptions.take : 50;

                $.ajax({
                    contentType: "application/json",
                    dataType: "json",
                    error: () => {
                        deferred.reject("Data Loading Error");
                    },
                    success: (result) => {
                        if (result.status === EnumStatus.OK && result.data.data && result.data.data.length > 0) {
                            deferred.resolve({
                                data: result.data.data,
                                totalCount: result.data.totalCount
                            });
                        } else {
                            deferred.resolve({
                                data: [],
                                totalCount: 0
                            });
                        }
                    },
                    type: "post",
                    url: "/api/permission-group/list",
                });

                return deferred.promise();
            }
        });
        this.userGroupStore = new CustomStore({
            key: "Id",
            load: () => {
                const def = $.Deferred();
                $.get("/api/group/list").done(xhr => {
                    if (xhr.status === EnumStatus.OK && xhr.data.length > 0) {
                        let dataSource = [{
                            Id: "Orphan",
                            Name: "Người dùng không thuộc nhóm nào"
                        }];
                        dataSource = dataSource.concat(xhr.data);
                        def.resolve(dataSource);
                    } else {
                        def.resolve([]);
                    }
                });
                return def.promise();
            },
            loadMode: "raw"
        });
        this.initPermissionGroupGrid();
        this.initUserGroup();
        new UserGridView(this.userContainer);
        new UserAuditView(this.userAuditContainer);
    }

    private initPermissionGroupGrid(): void {
        this.permissionGroupPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.permissionGroupForm = $("<div />").appendTo(container)
                    .dxForm({
                        formData: {
                            description: "",
                            id: 0,
                            name: ""
                        },
                        items: [{
                            dataField: "name",

                            label: {
                                text: "Tên nhóm quyền",
                            },
                            validationRules: [{
                                message: "Vui lòng nhập tên nhóm quyền",
                                type: "required"
                            }]
                        }, {
                            dataField: "description",

                            label: {
                                text: "Mô tả",
                            },
                            validationRules: [{
                                message: "Vui lòng nhập mô tả",
                                type: "required"
                            }]
                        }, {
                            template: () => {
                                return "<hr style=\"margin: 5px 0;\" />";
                            }
                        }, {
                            colSpan: 2,
                            template: (itemData, itemElement) => {
                                $("<div />").appendTo(itemElement)
                                    .dxToolbar({
                                        items: [{
                                            location: "center",
                                            options: {
                                                onClick: () => {
                                                    const validate = this.permissionGroupForm.validate();
                                                    if (validate && validate.brokenRules.length === 0) {
                                                        const data = this.permissionGroupForm.option("formData");
                                                        $.ajax({
                                                            contentType: "application/json",
                                                            data: JSON.stringify(data),
                                                            type: "post",
                                                            url: "/api/permission-group/saveOrUpdate",
                                                        }).done(xhr => {
                                                            if (xhr.status === EnumStatus.OK) {
                                                                OGUtils.alert("Lưu thông tin nhóm quyền thành công!").then(() => {
                                                                    this.permissionGroupGrid.getDataSource().reload();
                                                                    this.permissionGroupPopup.hide();
                                                                });
                                                            } else {
                                                                OGUtils.alert("Lưu thông tin nhóm quyền thất bại!");
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
                                                    this.permissionGroupPopup.hide();
                                                },
                                                stylingMode: "contained",
                                                text: "Hủy",
                                                type: "danger"
                                            },
                                            widget: "dxButton"
                                        }]
                                    });
                            }

                        }]
                    }).dxForm("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: "auto",
            hideOnOutsideClick: false,
            onContentReady: () => {
            },
            onOptionChanged: () => {

            },
            resizeEnabled: false,
            shading: true,
            showCloseButton: false,
            showTitle: true,
            title: "Thông tin nhóm",
            width: 500,
        }).dxPopup("instance");

        this.permissionGroupGrid = $("<div>").appendTo(this.permissionGroupContainer).dxDataGrid({
            allowColumnReordering: true,
            allowColumnResizing: false,
            columnChooser: {
                enabled: true,
                mode: "select"
            },
            columns: [{
                alignment: "center",
                caption: "STT",
                cellTemplate: (container, options) => {
                    const pageIndex = this.permissionGroupGrid.pageIndex();
                    const pageSize = this.permissionGroupGrid.pageSize();
                    container.append(`${(pageSize * pageIndex) + options.row.rowIndex + 1}`);
                },
                dataField: "index",
                width: 50,
            }, {
                caption: "Tên nhóm quyền",
                dataField: "name",
            }, {
                caption: "Mô tả",
                dataField: "description"
            }, {
                alignment: "center",
                allowEditing: false,
                caption: "Thao tác",
                cellTemplate: (container, options) => {
                    $("<div>").appendTo(container).dxToolbar({
                        items: [{
                            location: "center",
                            options: {
                                icon: "icon icon-edit-2",
                                onClick: () => {
                                    this.permissionGroupForm.option("formData", options.data);
                                    this.permissionGroupPopup.show();
                                },
                                type: "success"
                            },
                            widget: "dxButton"
                        }, {
                            location: "center",
                            options: {
                                disabled: options.data.permanent,
                                icon: "icon icon-trash",
                                onClick: () => {
                                    OGUtils.confirm("Xác nhận xóa nhóm quyền này?").then(anws => {
                                        if (anws) {
                                            $.ajax({
                                                data: {
                                                    id: options.data.id,
                                                },
                                                type: "post",
                                                url: "/api/permission-group/delete",
                                            }).done(xhr => {
                                                if (xhr.status === EnumStatus.OK) {
                                                    OGUtils.alert("Xóa nhóm quyền thành công!").then(() => {
                                                        this.permissionGroupGrid.getDataSource().reload();
                                                    });
                                                } else {
                                                    OGUtils.alert("Xóa nhóm quyền thất bại!");
                                                }
                                            });
                                        }
                                    });
                                },
                                type: "danger"
                            },
                            widget: "dxButton"
                        }, {
                            location: "center",
                            options: {
                                disabled: options.data.permanent,
                                hint: "Phân quyền",
                                icon: "icon icon-people",
                                onClick: () => {
                                    const permission_group_id = options.data.id;
                                    this.renderRoleTabs(RolesPopup_Type.ForPermissionGroup);

                                    // Quyền sử dụng lớp dữ liệu
                                    this.layerPermissionTree.beginUpdate();
                                    this.layerPermissionTree.option("dataSource.store",
                                        new CustomStore({
                                            key: "id",
                                            load: () => {
                                                const def = $.Deferred();
                                                $.get("/api/permission-group/getLayerRoles", { id: permission_group_id }).done(xhr => {
                                                    if (xhr.status === EnumStatus.OK) {
                                                        def.resolve({
                                                            data: xhr.data,
                                                            totalCount: xhr.data.length
                                                        });
                                                    } else {
                                                        def.resolve({
                                                            data: [],
                                                            totalCount: 0
                                                        });
                                                    }
                                                });

                                                return def;
                                            }
                                        })
                                    );
                                    this.layerPermissionTree.endUpdate();
                                    this.layerPermissionTree["permissionGroupId"] = permission_group_id;

                                    // Quyền sử dụng chức năng
                                    this.permissionRoleTree.beginUpdate();
                                    this.permissionRoleTree.option("dataSource.store",
                                        new CustomStore({
                                            key: "id",
                                            load: () => {
                                                const def = $.Deferred();

                                                $.get("/api/permission-group/getPermissionRoles", { id: permission_group_id }).done(xhr => {
                                                    if (xhr.status === EnumStatus.OK) {
                                                        def.resolve({
                                                            data: xhr.data,
                                                            totalCount: xhr.data.length
                                                        });
                                                    } else {
                                                        def.resolve({
                                                            data: [],
                                                            totalCount: 0
                                                        });
                                                    }
                                                });
                                                return def.promise();
                                            }
                                        })
                                    );
                                    this.permissionRoleTree.endUpdate();
                                    this.permissionRoleTree["permissionGroupId"] = permission_group_id;

                                    this.roleToolbar.option("visible", false);
                                    this.rolePopup["RolesPopup_Type"] = RolesPopup_Type.ForPermissionGroup;
                                    this.rolePopup.show();
                                },
                                type: "default"
                            },
                            widget: "dxButton"
                        },]
                    });
                },
                dataField: "id",
                width: 180,
            }],
            dataSource: new DataSource({
                store: this.permissionGroupStore
            }),
            disabled: false,
            errorRowEnabled: false,
            height: "100%",
            loadPanel: {
                text: "Đang tải dữ liệu"
            },
            noDataText: "Không có dữ liệu",
            onRowUpdating: function (options) {
                $.extend(options.newData, $.extend({}, options.oldData, options.newData));
            },
            onToolbarPreparing: (e) => {
                const dataGrid = e.component;
                e.toolbarOptions.items.unshift({
                    location: "after",
                    options: {
                        icon: "icon icon-user-add",
                        onClick: () => {
                            this.permissionGroupForm.resetValues();
                            this.permissionGroupPopup.show();
                        },
                        text: "Thêm nhóm quyền",
                        type: "default"
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        hint: "Làm mới bảng",
                        icon: "icon icon-refresh",
                        onClick: () => {
                            dataGrid.getDataSource().reload();
                        }
                    },
                    widget: "dxButton"
                });
            },
            pager: {
                allowedPageSizes: [50, 100, 200],
                infoText: "{2} bản ghi",
                showInfo: true,
                showNavigationButtons: true,
                showPageSizeSelector: true,
                visible: true,
            },
            paging: {
                enabled: true,
                pageSize: 50
            },
            scrolling: {
                showScrollbar: "always"
            },
            searchPanel: {
                visible: true
            },
            selection: {
                mode: "single",
                showCheckBoxesMode: "none"
            },
            showBorders: true,
            showRowLines: true,
            width: "100%",
        }).dxDataGrid("instance");
    }
    private initPermissionRoleTree(container): void {
        container = container.css("padding", "10px").css("height", "100%");

        this.permissionRoleTree = $("<div />").appendTo(container)
            .dxTreeView({
                dataSource: {},
                searchEnabled: true,
                showCheckBoxesMode: "normal",
            }).dxTreeView("instance");
    }

    private initRegionRoleTree(container): void {
        container = container.css("padding", "10px").css("height", "100%");

        this.regionRoleTree = $("<div />").appendTo(container)
            .dxTreeView({
                dataSource: {},
                searchEnabled: true,
                showCheckBoxesMode: "normal"
            }).dxTreeView("instance");
    }
    private initUserGroup(): void {
        this.userGroupView = $("<div />").appendTo(this.userGroupContainer).dxMultiView({
            deferRendering: false,
            height: "100%",
            items: [{
                template: (data, index, element) => {
                    this.initUserGroupGrid(element);
                }
            }, {
                template: (data, index, element) => {
                    this.userGridView = new UserGridView(element);
                }
            },],
            swipeEnabled: false
        }).dxMultiView("instance");
        this.userGridView.addUserGroupView(this.userGroupView);
    }

    private initUserGroupGrid(container): void {
        this.userGroupInfoPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.userGroupInfoForm = $("<div />").appendTo(container)
                    .dxForm({
                        formData: {
                            Description: "",
                            Id: "",
                            Name: ""
                        },
                        items: [{
                            dataField: "Name",

                            label: {
                                text: "Tên nhóm",
                            },
                            validationRules: [{
                                message: "Vui lòng nhập tên nhóm",
                                type: "required"
                            }]
                        }, {
                            dataField: "Description",

                            label: {
                                text: "Mô tả",
                            },
                            validationRules: [{
                                message: "Vui lòng nhập mô tả",
                                type: "required"
                            }]
                        }, {
                            dataField: "RoleId",
                            editorOptions: {
                                dataSource: this.roleStore,
                                displayExpr: "text",
                                placeholder: "Chọn quyền sử dụng",
                                value: "",
                                valueExpr: "value"
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Quyền sử dụng"
                            },
                            validationRules: [{
                                message: "Vui lòng quyền sử dụng",
                                type: "required"
                            }],
                        }, {
                            template: () => {
                                return "<hr style=\"margin: 5px 0;\" />";
                            }
                        }, {
                            colSpan: 2,
                            template: (itemData, itemElement) => {
                                $("<div />").appendTo(itemElement)
                                    .dxToolbar({
                                        items: [{
                                            location: "center",
                                            options: {
                                                onClick: () => {
                                                    const validate = this.userGroupInfoForm.validate();
                                                    if (validate && validate.brokenRules.length === 0) {
                                                        const data = this.userGroupInfoForm.option("formData");
                                                        $.ajax({
                                                            contentType: "application/json",
                                                            data: JSON.stringify(data),
                                                            type: "post",
                                                            url: "/api/group/saveOrUpdate",
                                                        }).done(xhr => {
                                                            if (xhr.status === EnumStatus.OK) {
                                                                OGUtils.alert("Lưu thông tin nhóm thành công!").then(() => {
                                                                    this.userGroupGrid.getDataSource().reload();
                                                                    this.userGroupInfoPopup.hide();
                                                                });
                                                            } else {
                                                                OGUtils.alert("Lưu thông tin nhóm thất bại!");
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
                                                    this.userGroupInfoPopup.hide();
                                                },
                                                stylingMode: "contained",
                                                text: "Hủy",
                                                type: "danger"
                                            },
                                            widget: "dxButton"
                                        }]
                                    });
                            }

                        }]
                    }).dxForm("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: "auto",
            hideOnOutsideClick: false,
            onContentReady: () => {
            },
            onOptionChanged: () => {

            },
            resizeEnabled: false,
            shading: true,
            showCloseButton: false,
            showTitle: true,
            title: "Thông tin nhóm",
            width: 500,
        }).dxPopup("instance");

        this.userGroupGrid = $("<div>").appendTo(container).dxDataGrid({
            allowColumnReordering: true,
            allowColumnResizing: false,
            columnChooser: {
                enabled: true,
                mode: "select"
            },
            columns: [{
                alignment: "center",
                caption: "STT",
                cellTemplate: (container, options) => {
                    const pageIndex = this.userGroupGrid.pageIndex();
                    const pageSize = this.userGroupGrid.pageSize();
                    container.append(`${(pageSize * pageIndex) + options.row.rowIndex + 1}`);
                },
                dataField: "index",
                width: 50,
            }, {
                caption: "Tên nhóm",
                dataField: "Name",
            }, {
                caption: "Mô tả",
                dataField: "Description"
            }, {
                caption: "Quyền sử dụng",
                customizeText: (e) => {
                    return e.value === "administrator" ? "Quản trị viên" : "Người dùng";
                },
                dataField: "Code",
            }, {
                alignment: "center",
                allowEditing: false,
                caption: "Thao tác",
                cellTemplate: (container, options) => {
                    $("<div>").appendTo(container).dxToolbar({
                        items: [{
                            location: "center",
                            options: {
                                icon: "icon icon-edit-2",
                                onClick: () => {
                                    this.userGroupInfoForm.option("formData", options.data);
                                    this.userGroupInfoPopup.show();
                                },
                                type: "success"
                            },
                            widget: "dxButton"
                        }, {
                            location: "center",
                            options: {
                                disabled: options.data.permanent,
                                icon: "icon icon-trash",
                                onClick: () => {
                                    OGUtils.confirm("Xác nhận xóa nhóm người dùng này? Tất cả người dùng thuộc nhóm này cũng sẽ bị xóa!").then(anws => {
                                        if (anws) {
                                            $.ajax({
                                                data: {
                                                    Id: options.data.Id,
                                                },
                                                type: "post",
                                                url: "/api/group/delete",
                                            }).done(xhr => {
                                                if (xhr.status === EnumStatus.OK) {
                                                    OGUtils.alert("Xóa nhóm thành công!").then(() => {
                                                        this.userGroupGrid.getDataSource().reload();
                                                    });
                                                } else {
                                                    OGUtils.alert("Xóa nhóm thất bại!");
                                                }
                                            });
                                        }
                                    });
                                },
                                type: "danger"
                            },
                            widget: "dxButton"
                        }, {
                            location: "center",
                            options: {
                                dropDownOptions: {
                                    width: "150px"
                                },
                                icon: "icon icon-setting-2",
                                items: [{
                                    disabled: options.data.permanent,
                                    icon: (options.data.LockoutEnabled) === false ? "icon icon-lock" : "icon icon-lock-slash",
                                    onClick: () => {
                                        const confirmText = options.data.LockoutEnabled ? "Bạn muốn mở khóa nhóm người dùng này?" : "Bạn muốn khóa nhóm người dùng này?";
                                        OGUtils.confirm(confirmText).then(value => {
                                            if (value) {
                                                options.data.LockoutEnabled = !options.data.LockoutEnabled;
                                                $.ajax({
                                                    contentType: "application/json",
                                                    data: JSON.stringify(options.data),
                                                    error: () => {
                                                        OGUtils.alert("Thất bại");
                                                    },
                                                    success: (xhr) => {
                                                        if (xhr.data === EnumStatus.OK) OGUtils.alert("Thành công");
                                                        else OGUtils.alert("Thất bại");
                                                        this.userGroupGrid.getDataSource().reload();
                                                        this.userGrid.getDataSource().reload();
                                                    },
                                                    type: "post",
                                                    url: "/api/group/setLock"
                                                });
                                            }
                                        });
                                    },
                                    text: (options.data.LockoutEnabled) === false ? "Khóa nhóm người dùng" : "Mở khóa nhóm người dùng",
                                    type: "default",
                                }, {
                                    disabled: options.data.permanent,
                                    hint: "Phân quyền",
                                    icon: "icon icon-people",
                                    onClick: () => {
                                        const group_id = options.data.Id;
                                        this.renderRoleTabs(RolesPopup_Type.ForGroup);
                                        // this.foldersTree.beginUpdate();
                                        // this.foldersTree.option("dataSource.store",
                                        //     new CustomStore({
                                        //         key: "id",
                                        //         load: () => {
                                        //             const def = $.Deferred();
                                        //             $.get("/api/group/folders", { id: group_id }).done(xhr => {
                                        //                 if (xhr.status === EnumStatus.OK) {
                                        //                     def.resolve({
                                        //                         data: xhr.data,
                                        //                         totalCount: xhr.data.length
                                        //                     });
                                        //                 } else {
                                        //                     def.resolve({
                                        //                         data: [],
                                        //                         totalCount: 0
                                        //                     });
                                        //                 }
                                        //             });

                                        //             return def;
                                        //         }
                                        //     })
                                        // );
                                        // this.foldersTree.endUpdate();
                                        this.foldersTree["groupId"] = group_id;
                                        //Quyền sử dụng lớp dữ liệu
                                        this.layerPermissionTree.beginUpdate();
                                        this.layerPermissionTree.option("dataSource.store",
                                            new CustomStore({
                                                key: "id",
                                                load: () => {
                                                    const def = $.Deferred();
                                                    $.get("/api/group/getLayerRoles", { id: group_id }).done(xhr => {
                                                        if (xhr.status === EnumStatus.OK) {
                                                            def.resolve({
                                                                data: xhr.data,
                                                                totalCount: xhr.data.length
                                                            });
                                                        } else {
                                                            def.resolve({
                                                                data: [],
                                                                totalCount: 0
                                                            });
                                                        }
                                                    });
                                                    return def.promise();
                                                }
                                            })
                                        );
                                        this.layerPermissionTree.endUpdate();
                                        this.layerPermissionTree["groupId"] = group_id;

                                        // Quyền sử dụng chức năng
                                        this.permissionRoleTree.beginUpdate();
                                        this.permissionRoleTree.option("dataSource.store",
                                            new CustomStore({
                                                key: "id",
                                                load: () => {
                                                    const def = $.Deferred();

                                                    $.get("/api/group/getPermissionRoles", { id: group_id }).done(xhr => {
                                                        if (xhr.status === EnumStatus.OK) {
                                                            def.resolve({
                                                                data: xhr.data,
                                                                totalCount: xhr.data.length
                                                            });
                                                        } else {
                                                            def.resolve({
                                                                data: [],
                                                                totalCount: 0
                                                            });
                                                        }
                                                    });
                                                    return def.promise();
                                                }
                                            })
                                        );
                                        this.permissionRoleTree.endUpdate();
                                        this.permissionRoleTree["groupId"] = group_id;

                                        // Quyền quản lý hành chính
                                        this.regionRoleTree.beginUpdate();
                                        this.regionRoleTree.option("dataSource.store",
                                            new CustomStore({
                                                key: "id",
                                                load: () => {
                                                    const def = $.Deferred();

                                                    $.get("/api/group/getRegionRoles", { id: group_id }).done(xhr => {
                                                        if (xhr.status === EnumStatus.OK) {
                                                            def.resolve({
                                                                data: xhr.data,
                                                                totalCount: xhr.data.length
                                                            });
                                                        } else {
                                                            def.resolve({
                                                                data: [],
                                                                totalCount: 0
                                                            });
                                                        }
                                                    });
                                                    return def.promise();
                                                }
                                            })
                                        );
                                        this.regionRoleTree.endUpdate();
                                        this.regionRoleTree["groupId"] = group_id;

                                        // Quyền quản lý tài khoản
                                        this.userRoleTree.beginUpdate();
                                        this.userRoleTree.option("dataSource.store",
                                            new CustomStore({
                                                key: "id",
                                                load: () => {
                                                    const def = $.Deferred();

                                                    $.get("/api/group/getUserRoles", { id: group_id }).done(xhr => {
                                                        if (xhr.status === EnumStatus.OK) {
                                                            def.resolve({
                                                                data: xhr.data,
                                                                totalCount: xhr.data.length
                                                            });
                                                        } else {
                                                            def.resolve({
                                                                data: [],
                                                                totalCount: 0
                                                            });
                                                        }
                                                    });
                                                    return def.promise();
                                                }
                                            })
                                        );
                                        this.userRoleTree.endUpdate();
                                        this.userRoleTree["groupId"] = group_id;

                                        this.roleToolbar.option("visible", false);
                                        this.rolePopup["RolesPopup_Type"] = RolesPopup_Type.ForGroup;
                                        this.rolePopup.show();
                                    },
                                    text: "Phân quyền",
                                    type: "default"
                                }, {
                                    disabled: options.data.permanent,
                                    icon: "icon icon-grid-1",
                                    onClick: () => {
                                        this.userGridView.reload(options.data.Id);
                                        this.userGroupView.option("selectedIndex", 1);
                                    },
                                    text: "Danh sách người dùng thuộc nhóm",
                                    type: "default",
                                },],
                                onContentReady: (e) => {
                                    e.element.find(".dx-list-item").each(function () {
                                        const $ele = $(this);
                                        $ele.attr("title", $ele.find(".dx-list-item-content").text());
                                    });
                                },
                                stylingMode: "contained",
                                text: "Thao tác",
                                type: "default"
                            },
                            widget: "dxDropDownButton"
                        },]
                    });
                },
                dataField: "id",
                width: 250,
            }],
            dataSource: new DataSource({
                store: new CustomStore({
                    key: "Id",
                    load: () => {
                        const def = $.Deferred();
                        $.get("/api/group/list").done(xhr => {
                            if (xhr.status === EnumStatus.OK && xhr.data.length > 0) {
                                def.resolve({
                                    data: xhr.data,
                                    totalCount: xhr.data.length
                                });
                            } else {
                                def.resolve({
                                    data: [],
                                    totalCount: 0
                                });
                            }
                        });
                        return def;
                    }
                })
            }),
            disabled: false,
            errorRowEnabled: false,
            height: "100%",
            loadPanel: {
                text: "Đang tải dữ liệu"
            },
            noDataText: "Không có dữ liệu",
            onRowUpdating: function (options) {
                $.extend(options.newData, $.extend({}, options.oldData, options.newData));
            },
            onToolbarPreparing: (e) => {
                const dataGrid = e.component;
                e.toolbarOptions.items.unshift({
                    location: "after",
                    options: {
                        icon: "icon icon-user-add",
                        onClick: () => {
                            this.userGroupInfoForm.resetValues();
                            this.userGroupInfoPopup.show();
                        },
                        text: "Thêm nhóm người dùng",
                        type: "default"
                    },
                    widget: "dxButton"
                }, {
                    location: "after",
                    options: {
                        hint: "Làm mới bảng",
                        icon: "icon icon-refresh",
                        onClick: () => {
                            dataGrid.getDataSource().reload();
                        }
                    },
                    widget: "dxButton"
                });
            },
            pager: {
                allowedPageSizes: [50, 100, 200],
                infoText: "{2} bản ghi",
                showInfo: true,
                showNavigationButtons: true,
                showPageSizeSelector: true,
                visible: true,
            },
            paging: {
                enabled: true,
                pageSize: 50
            },
            scrolling: {
                showScrollbar: "always"
            },
            searchPanel: {
                visible: true
            },
            selection: {
                mode: "single",
                showCheckBoxesMode: "none"
            },
            showBorders: true,
            showRowLines: true,
            width: "100%",
        }).dxDataGrid("instance");
    }
    private initUserRoleTree(container): void {
        container = container.css("padding", "10px").css("height", "100%");

        this.userRoleTree = $("<div />").appendTo(container)
            .dxTreeView({
                dataSource: {},
                searchEnabled: true,
                showCheckBoxesMode: "normal"
            }).dxTreeView("instance");
    }
    private renderRoleTabs(type: number): void {
        if (type == RolesPopup_Type.ForGroup) {
            this.roleTab.option("dataSource", [{
                id: "layer",
                text: "Quyền sử dụng lớp dữ liệu"
            }, {
                id: "functions",
                text: "Quyền sử dụng chức năng"
            }, {
                id: "regions",
                text: "Quyền quản lý hành chính"
            }, {
                id: "users",
                text: "Quyền quản lý tài khoản"
            }, {
                id: "folders",
                text: "Quyền quản lý thư mục"
            }]);
        } else if (type == RolesPopup_Type.ForUser) {
            this.roleTab.option("dataSource", [{
                id: "layer",
                text: "Quyền sử dụng lớp dữ liệu"
            }, {
                id: "functions",
                text: "Quyền sử dụng chức năng"
            }, {
                id: "regions",
                text: "Quyền quản lý hành chính"
            }, {
                id: "folders",
                text: "Quyền quản lý thư mục"
            }]);
        } else {
            this.roleTab.option("dataSource", [{
                id: "layer",
                text: "Quyền sử dụng lớp dữ liệu"
            }, {
                id: "functions",
                text: "Quyền sử dụng chức năng"
            }]);
        }
    }
    onInit(): void {
        $("#header").find(".header-title >span").html("Quản lý người dùng");
        this.permissionGroupContainer = $("#permission-group-container");
        this.userGroupContainer = $("#user-group-container");
        this.userContainer = $("#user-container");
        this.userAuditContainer = $("#user-audit-container");
        $(".tab-item-container").css({
            "background-color": "white"
        }).height(window.innerHeight - $("header").outerHeight());
        this.switchModule = new SwitchModuleWindowComponent("user");
        this.initLayout();
        this.bindEvents();
    }
}