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

import { IBaseComponent } from "../../../../../../../libs/core/components/base-component.abstract";
import { EnumStatus } from "../../../../../../../libs/core/enums/enums";
import { OGUtils } from "../../../../../../../libs/core/helpers/utils";
import { AreaService } from "../../../../../../../libs/core/services/area.service";
import UserInfoTemp from "../../templates/user-info.hbs";
import "./user-grid.scss";

class OGUserViewOtions {
    userGroupId?: string;
}

class UserGridView implements IBaseComponent {
    changePasswordForm: dxForm;
    changePasswordPopup: dxPopup;
    columnsTree: dxTreeView;
    container: JQuery<HTMLElement>;
    districtStore: CustomStore;
    foldersTree: dxTreeView;
    grid: dxDataGrid;
    layerPermissionTree: dxTreeView;
    moveUserForm: dxForm;
    moveUserPopup: dxPopup;
    newRegionData: boolean = false;
    permissionGroupStore: CustomStore;
    permissionRoleTree: dxTreeView;
    refreshColumns: boolean = false;
    regionRoleTree: dxTreeView;
    reportRoleTree: dxTreeView;
    rolePopup: dxPopup;
    roleStore: CustomStore;
    roleTab: dxTabPanel;
    roleToolbar: dxToolbar;
    selectedUserGroupID: string;
    tablePermissionTree: dxTreeView;
    userGrid: dxDataGrid;
    userGroupStore: CustomStore;
    userGroupView: dxMultiView;
    userId: string;
    userInfoForm: dxForm;
    userInfoPopup: dxPopup;
    userRoleTree: dxTreeView;
    userStore: CustomStore;
    constructor(container: JQuery<HTMLElement>, options?: OGUserViewOtions) {
        this.container = container;
        this.selectedUserGroupID = options ? options.userGroupId : "";
        this.initLayout();
    }
    private initColumnsTree(container): void {
        $("<span class=\"font-weight-bolder\" style=\"color:red\">Chọn bảng dữ liệu trước khi chọn trường dữ liệu</span>").appendTo(container);
        container = container.css("padding", "10px");

        this.columnsTree = $("<div />").appendTo(container)
            .dxTreeView({
                dataSource: {},
                searchEnabled: true,
                showCheckBoxesMode: "normal",
            }).dxTreeView("instance");
    }
    private initFoldersTree(container): void {
        container = container.css("padding", "10px").css("height", "100%");

        this.foldersTree = $("<div />").appendTo(container)
            .dxTreeView({
                dataSource: {},
                searchEnabled: true,
                showCheckBoxesMode: "normal"
            }).dxTreeView("instance");
    }
    private initLayerRoleTree(container): void {
        container = container.css("padding", "10px");

        this.layerPermissionTree = $("<div />").appendTo(container)
            .dxTreeView({
                dataSource: {},
                onSelectionChanged: (e) => {
                    this.refreshColumns = true;
                },
                searchEnabled: true,
                showCheckBoxesMode: "normal",
            }).dxTreeView("instance");
    }
    private initLayout(): void {
        const self = this;
        let selectedRole = null;
        //Popup đổi mật khẩu người dùng
        this.changePasswordPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.changePasswordForm = $("<div />").appendTo(container)
                    .dxForm({
                        formData: {},
                        items: [{
                            dataField: "newPasswd",
                            editorOptions: {
                                buttons: [{
                                    location: "after",
                                    name: "newPasswd",
                                    options: {
                                        elementAttr: {
                                            class: "passwd-element-class"
                                        },
                                        icon: "eyeopen",
                                        onClick() {
                                            self.changePasswordForm.getEditor("Password").option("mode", self.changePasswordForm.getEditor("Password").option("mode") === "text" ? "password" : "text");
                                        },
                                        stylingMode: "text",
                                    },
                                }],
                                mode: "password",
                            },
                            label: {
                                text: "Mật khẩu",
                            },
                            validationRules: [{
                                message: "Vui lòng nhập mật khẩu",
                                type: "required",
                            }, {
                                message: "Vui lòng nhập mật khẩu",
                                type: "required",
                            },]
                        }, {
                            dataField: "confirmNewPasswd",
                            editorOptions: {
                                buttons: [{
                                    location: "after",
                                    name: "newPasswd",
                                    options: {
                                        elementAttr: {
                                            class: "passwd-element-class"
                                        },
                                        icon: "eyeopen",
                                        onClick() {
                                            self.changePasswordForm.getEditor("confirmNewPasswd").option("mode", self.changePasswordForm.getEditor("confirmNewPasswd").option("mode") === "text" ? "password" : "text");
                                        },
                                        stylingMode: "text",
                                    },
                                }],
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
                            } else if (itemData.id === "table") {
                                self.initTableRoleTree(scrollView);
                            } else if (itemData.id === "columns") {
                                self.initColumnsTree(scrollView);
                            } else if (itemData.id === "functions") {
                                self.initPermissionRoleTree(scrollView);
                            } else if (itemData.id === "regions") {
                                self.initRegionRoleTree(scrollView);
                            } else if (itemData.id === "users") {
                                self.initUserRoleTree(scrollView);
                            }
                            // else if (itemData.id === "folders") {
                            //     self.initFoldersTree(scrollView);
                            // }
                            // else if (itemData.id === "reports") {
                            //     self.initReportRoleTree(scrollView);
                            // }
                            scrollView.dxScrollView();
                        },
                        itemTitleTemplate: (itemData) => {
                            return itemData.text;
                        },
                        items: [{
                            id: "layer",
                            text: "Quyền sử dụng lớp dữ liệu"
                        }, {
                            id: "table",
                            text: "Quyền sử dụng bảng dữ liệu"
                        }, {
                            id: "columns",
                            text: "Quyền sử dụng trường dữ liệu"
                        }, {
                            id: "functions",
                            text: "Quyền sử dụng chức năng"
                        }, {
                            id: "regions",
                            text: "Quyền quản lý hành chính"
                        },
                        {
                            id: "folders",
                            text: "Quyền quản lý thư mục"
                        },
                        {
                            id: "reports",
                            text: "Quyền sử dụng báo cáo"
                        },
                        ],
                        loop: false,
                        onSelectionChanged: (e) => {
                            if (e.addedItems.length && e.addedItems[0].id === "columns") {
                                if (self.refreshColumns) {
                                    self.refreshColumns = false;
                                    const layerTableId = this.layerPermissionTree.getDataSource().items().map(x => x.items.filter(x => x.selected && x.raw)).flat().map(x => x.raw.table_info_id);
                                    const tableId = this.tablePermissionTree.getDataSource().items().map(x => x.items.filter(x => x.selected && x.raw)).flat().map(x => x.raw.id);
                                    const distinct = OGUtils.distinct(layerTableId.concat(tableId));
                                    if (this.columnsTree["userId"] && distinct) {
                                        this.columnsTree.beginUpdate();
                                        this.columnsTree.option("dataSource.store",
                                            new CustomStore({
                                                key: "id",
                                                load: () => {
                                                    const def = $.Deferred();
                                                    $.ajax({
                                                        contentType: "application/json",
                                                        data: JSON.stringify({
                                                            table_ids: distinct,
                                                            user_id: this.columnsTree["userId"]
                                                        }),
                                                        type: "POST",
                                                        url: "/api/user/user-columns",
                                                    }).done(xhr => {
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
                                        this.columnsTree.endUpdate();
                                    }
                                }
                                else
                                    self.refreshColumns = false;
                            }
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
                                    id: "sa",
                                    text: "Quản trị hệ thống"
                                }, {
                                    id: "administrator",
                                    text: "Quản trị nhóm"
                                }, {
                                    id: "user",
                                    text: "Chuyên viên"
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
            onHidden: () => {
                self.userId = undefined;
            },
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
                        const tableRoles = [];
                        $.each(this.tablePermissionTree.getDataSource().items(), (idx, item) => {
                            if (item && item.items) {
                                $.each(item.items, (childIdx, child) => {
                                    if (child.selected && child.raw) {
                                        tableRoles.push(child.raw.id);
                                    }
                                });
                            }
                        });
                        const columns = [];
                        $.each(this.columnsTree.getDataSource().items(), (idx, item) => {
                            if (item && item.items) {
                                $.each(item.items, (childIdx, child) => {
                                    $.each(child.items, (child2Idx, child2) => {
                                        if (child2.selected && child2.raw) {
                                            columns.push(child2.raw.id);
                                        }
                                    });
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
                        // const regionRoles = [];
                        // $.each(this.regionRoleTree.getDataSource().items(), (idx, item) => {
                        //     if (item && item.items) {
                        //         let hasSelected = false;
                        //         $.each(item.items, (childIdx, child) => {
                        //             if (child.selected && child.raw) {
                        //                 hasSelected = true;
                        //                 regionRoles.push(child.raw.area_id);
                        //             }
                        //         });

                        //         if (hasSelected) {
                        //             regionRoles.push(item.raw.area_id);
                        //         }
                        //     }
                        // });
                        const regionRoles = this.regionRoleTree.getSelectedNodes().map(x => {
                            return {
                                area_code: x.key,
                                area_type: x.itemData["area_type"],
                                user_id: this.regionRoleTree["userId"]
                            };
                        });
                        console.log(this.regionRoleTree.getSelectedNodes());
                        // const folders = [];
                        // $.each(this.foldersTree.getDataSource().items(), (idx, item) => {
                        //     if (item.selected && item.raw) {
                        //         folders.push(item.raw.id);
                        //     }
                        // });
                        // const reports = [];
                        // $.each(this.reportRoleTree.getDataSource().items(), (idx, item) => {
                        //     if (item && item.items) {
                        //         $.each(item.items, (childIdx, child) => {
                        //             if (child.selected && child.raw) {
                        //                 reports.push(child.raw.id);
                        //             }
                        //         });
                        //     }
                        //     else {
                        //         if (item && item.selected && item.raw) {
                        //             reports.push(item.raw.id);
                        //         }
                        //     }
                        // });
                        OGUtils.showLoading();
                        $.when(
                            $.ajax({
                                contentType: "application/json",
                                data: JSON.stringify({
                                    layers: JSON.stringify(layerRoles),
                                    user_id: this.layerPermissionTree["userId"]
                                }),
                                type: "post",
                                url: "/api/user/saveLayerRoles"
                            }),
                            $.ajax({
                                contentType: "application/json",
                                data: JSON.stringify({
                                    tables: JSON.stringify(tableRoles),
                                    user_id: this.tablePermissionTree["userId"]
                                }),
                                type: "post",
                                url: "/api/user/saveTableRoles"
                            }),
                            $.ajax({
                                contentType: "application/json",
                                data: JSON.stringify({
                                    permissions: JSON.stringify(permissionRoles),
                                    role: selectedRole,
                                    user_id: this.permissionRoleTree["userId"]
                                }),
                                type: "post",
                                url: "/api/user/savePermissionRoles"
                            }),
                            $.ajax({
                                contentType: "application/json",
                                data: JSON.stringify({
                                    regions: JSON.stringify(regionRoles),
                                    user_id: this.regionRoleTree["userId"]
                                }),
                                type: "post",
                                url: "/api/user/saveRegionRoles"
                            }),
                            // $.ajax({
                            //     contentType: "application/json",
                            //     data: JSON.stringify({
                            //         folders: JSON.stringify(folders),
                            //         user_id: this.foldersTree["userId"]
                            //     }),
                            //     type: "post",
                            //     url: "/api/user/save-folders"
                            // }),
                            $.ajax({
                                contentType: "application/json",
                                data: JSON.stringify({
                                    columns: JSON.stringify(columns),
                                    user_id: this.columnsTree["userId"]
                                }),
                                type: "post",
                                url: "/api/user/save-columns"
                            }),
                            // $.ajax({
                            //     contentType: "application/json",
                            //     data: JSON.stringify({
                            //         reports: JSON.stringify(reports),
                            //         user_id: this.reportRoleTree["userId"]
                            //     }),
                            //     type: "post",
                            //     url: "/api/user/save-reports"
                            // })
                        ).then(() => {
                            OGUtils.hideLoading();
                            this.userGrid.getDataSource().reload();
                            this.rolePopup.hide();
                            OGUtils.toastSuccess("Lưu thành công!");
                        });

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
            width: "auto",
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
                    BypassApprove: values.userInfo.bypass_approve || false,
                    DistrictId: values.userInfo.district_code,
                    Email: values.email,
                    FullName: values.userInfo.full_name,
                    Notification: values.notification,
                    PhoneNumber: values.phone_number,
                    Position: values.userInfo.position,
                    SendApp: values.userInfo.send_app || false,
                    SendMail: values.userInfo.send_mail || false,
                    SendSms: values.userInfo.send_sms || false,
                    Unit: values.userInfo.unit,
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
        this.districtStore = new CustomStore({
            load: async () => {
                const province_code = "01";
                return await AreaService.districts(province_code);
            },
            loadMode: "raw"
        });
        this.initUserGrid(this.container);
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
        const self = this;
        this.regionRoleTree = $("<div />").appendTo(container)
            .dxTreeView({
                dataSource: new DataSource({
                    store: new CustomStore({
                        key: "id",
                        load: function (loadOptions) {
                            const def = $.Deferred();

                            const area_code: string = loadOptions.filter.length ? loadOptions.filter[1] : 0;
                            let area_type = area_code.length ? (area_code.length - 1) : 0;
                            if (self.newRegionData) {
                                area_type = 0;
                                self.newRegionData = false;
                            }
                            $.get("/api/user/getRegionRoles", {
                                area_code: area_code,
                                area_type: area_type,
                                id: self.userId
                            }).done(function (data) {
                                if (data.status == "OK") {
                                    def.resolve(data.data);
                                }
                                else {
                                    def.resolve([]);
                                }

                            });
                            return def.promise();
                        }
                    })
                }),
                dataStructure: "plain",
                displayExpr: "text",
                hasItemsExpr: "isParent",
                keyExpr: "id",
                parentIdExpr: "parentId",
                showCheckBoxesMode: "normal",
                virtualModeEnabled: true,
            }).dxTreeView("instance");
    }
    private initReportRoleTree(container): void {
        container = container.css("padding", "10px").css("height", "100%");

        this.reportRoleTree = $("<div />").appendTo(container)
            .dxTreeView({
                dataSource: {},
                searchEnabled: true,
                showCheckBoxesMode: "normal",
            }).dxTreeView("instance");
    }

    private initTableRoleTree(container): void {
        container = container.css("padding", "10px");

        this.tablePermissionTree = $("<div />").appendTo(container)
            .dxTreeView({
                dataSource: {},
                onSelectionChanged: (e) => {
                    this.refreshColumns = true;
                },
                searchEnabled: true,
                showCheckBoxesMode: "normal",
            }).dxTreeView("instance");
    }
    private initUserGrid(container): void {
        const self = this;
        this.userInfoPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.userInfoForm = $("<div />").appendTo(container)
                    .dxForm({
                        colCount: 2,
                        items: [{
                            dataField: "UserName",
                            label: {
                                text: "Tên đăng nhập",
                            },
                            validationRules: [{
                                message: "Vui lòng nhập tên đăng nhập",
                                type: "required"
                            }, {
                                message: "Tên đăng nhập không được chứa kí tự đặc biệt, tối thiểu 2 kí tự, tối đa 20 kí tự",
                                pattern: /^[A-Za-z][A-Za-z0-9_]{1,19}$/,
                                type: "pattern",
                            }]
                        }, {
                            dataField: "FullName",
                            label: {
                                text: "Tên đầy đủ",
                            },
                            validationRules: [{
                                message: "Vui lòng nhập họ tên",
                                type: "required"
                            }, {
                                max: 256,
                                message: "Không nhập quá 256 ký tự",
                                type: "stringLength"
                            }, {
                                message: "Không được nhập giá trị có chưa mã nguồn",
                                type: "custom",
                                validationCallback: (e) => {
                                    if (e.value) {
                                        return !OGUtils.hasHtmlTag(e.value);
                                    }
                                    return true;
                                }
                            }, {
                                message: "Không được nhập giá trị có kí tự đặc biệt",
                                type: "custom",
                                validationCallback: (e) => {
                                    if (e.value) {
                                        return !OGUtils.hasSpecialChar(e.value);
                                    }
                                    return true;
                                }
                            },]
                        }, {
                            dataField: "Password",
                            editorOptions: {
                                buttons: [{
                                    location: "after",
                                    name: "Password",
                                    options: {
                                        elementAttr: {
                                            class: "passwd-element-class"
                                        },
                                        icon: "eyeopen",
                                        onClick() {
                                            self.userInfoForm.getEditor("Password").option("mode", self.userInfoForm.getEditor("Password").option("mode") === "text" ? "password" : "text");
                                        },
                                        // type: "default",
                                        stylingMode: "text",
                                    },

                                }],
                                mode: "password",
                            },
                            label: {
                                text: "Mật khẩu",
                            },
                            validationRules: [{
                                message: "Vui lòng nhập mật khẩu",
                                type: "required"
                            }, {
                                max: 20,
                                message: "Mật khẩu có độ dài 8-20 kí tự",
                                min: 8,
                                type: "stringLength",
                            },
                            // {
                            //     max: 20,
                            //     message: "Mật khẩu có độ dài 20 kí tự",
                            //     type: "stringLength",
                            // },
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
                            },
                            ]
                        }, {
                            dataField: "ConfirmPassword",
                            editorOptions: {
                                buttons: [{
                                    location: "after",
                                    name: "ConfirmPassword",
                                    options: {
                                        elementAttr: {
                                            class: "passwd-element-class"
                                        },
                                        icon: "eyeopen",
                                        onClick() {
                                            self.userInfoForm.getEditor("ConfirmPassword").option("mode", self.userInfoForm.getEditor("ConfirmPassword").option("mode") === "text" ? "password" : "text");
                                        },
                                        stylingMode: "text",
                                    },
                                }],
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
                                    return this.userInfoForm.option("formData").Password === e.value;
                                }
                            }]
                        }, {
                            dataField: "Email",
                            label: {
                                text: "Email",
                            },
                            validationRules: [
                                //     {
                                //     message: "Vui lòng nhập email",
                                //     type: "required"
                                // }, 
                                {
                                    message: "Vui lòng nhập đúng định dạng email",
                                    type: "email",
                                }]
                        }, {
                            dataField: "PhoneNumber",
                            label: {
                                text: "Di động",
                            },
                            validationRules: [
                                //     {
                                //     message: "Vui lòng nhập số điện thoại",
                                //     type: "required"
                                // }, 
                                {
                                    message: "Vui lòng nhập số điện thoại đúng định dạng",
                                    pattern: /^[02-9]\d{9}$/,
                                    type: "pattern",
                                }]
                        }, {
                            dataField: "Unit",
                            label: {
                                text: "Đơn vị công tác",
                            },
                            validationRules: [{
                                message: "Không được nhập giá trị có chưa mã nguồn",
                                type: "custom",
                                validationCallback: (e) => {
                                    if (e.value) {
                                        return !OGUtils.hasHtmlTag(e.value);
                                    }
                                    return true;

                                }
                            }, {
                                message: "Không được nhập giá trị có kí tự đặc biệt",
                                type: "custom",
                                validationCallback: (e) => {
                                    if (e.value) {
                                        return !OGUtils.hasSpecialChar(e.value);
                                    }
                                    return true;
                                }
                            },]
                        }, {
                            dataField: "Position",
                            label: {
                                text: "Chức vụ",
                            },
                            validationRules: [{
                                message: "Không được nhập giá trị có chưa mã nguồn",
                                type: "custom",
                                validationCallback: (e) => {
                                    if (e.value) {
                                        return !OGUtils.hasHtmlTag(e.value);
                                    }
                                    return true;
                                }
                            }, {
                                message: "Không được nhập giá trị có kí tự đặc biệt",
                                type: "custom",
                                validationCallback: (e) => {
                                    if (e.value) {
                                        return !OGUtils.hasSpecialChar(e.value);
                                    }
                                    return true;
                                }
                            },]
                        }, {
                            dataField: "DistrictId",
                            editorOptions: {
                                dataSource: new DataSource({
                                    store: this.districtStore
                                }),
                                displayExpr: "name_vn",
                                onContentReady: (e) => {
                                    e.element.css("float", "left");
                                    $(".dx-list-item-content").each(function () {
                                        const $ele = $(this);
                                        if (this.offsetWidth < this.scrollWidth) {
                                            $ele.attr("title", $ele.text());
                                        }
                                    });
                                },
                                placeholder: "[Chọn...]",
                                searchEnabled: true,
                                valueExpr: "area_id",
                                width: "100%",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                location: "top",
                                text: "Quận/Huyện",
                            },
                        }, {
                            dataField: "GroupId",
                            editorOptions: {
                                dataSource: new DataSource({
                                    store: this.userGroupStore
                                }),
                                displayExpr: "Name",
                                placeholder: "[Chọn...]",
                                searchEnabled: true,
                                valueExpr: "Id",
                                width: "100%",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Nhóm người dùng",
                            },
                        }, {
                            dataField: "SendSms",
                            editorType: "dxCheckBox",
                            label: {
                                text: "Nhận cảnh báo qua SMS",
                            },
                        }, {
                            dataField: "SendApp",
                            editorType: "dxCheckBox",
                            label: {
                                text: "Nhận cảnh báo qua ứng dụng",
                            },
                        }, {
                            dataField: "SendMail",
                            editorType: "dxCheckBox",
                            label: {
                                text: "Nhận cảnh báo qua mail",
                            },
                        }, {
                            dataField: "BypassApprove",
                            editorType: "dxCheckBox",
                            label: {
                                text: "Nhập liệu không cần phê duyệt",
                            },
                        }, {
                            colSpan: 2,
                            template: (itemData, itemElement) => {
                                $("<div />").appendTo(itemElement)
                                    .dxToolbar({
                                        items: [{
                                            location: "center",
                                            options: {
                                                onClick: () => {
                                                    const validate = this.userInfoForm.validate();
                                                    if (validate && validate.brokenRules.length === 0) {
                                                        const data = this.userInfoForm.option("formData");
                                                        OGUtils.showLoading();
                                                        if (!data.UserId) {
                                                            $.ajax({
                                                                contentType: "application/json",
                                                                data: JSON.stringify(data),
                                                                type: "POST",
                                                                url: "/api/user/create",
                                                            }).done(xhr => {
                                                                if (xhr.status === EnumStatus.OK) {
                                                                    $.ajax({
                                                                        contentType: "application/json",
                                                                        data: JSON.stringify(data),
                                                                        type: "POST",
                                                                        url: "/api/user/saveOfUpdateRole",
                                                                    }).done(xhr => {
                                                                        if (xhr.status === EnumStatus.OK) {
                                                                            OGUtils.alert("Tạo người sử dụng mới thành công!").then(() => {
                                                                                this.userGrid.getDataSource().reload();
                                                                                this.userInfoPopup.hide();
                                                                            });
                                                                        }
                                                                        // if (xhr.status === EnumStatus.OK) {
                                                                        //     $.ajax({
                                                                        //         contentType: "application/json",
                                                                        //         data: JSON.stringify(data),
                                                                        //         type: "POST",
                                                                        //         url: "/api/user/saveOrUpdateClaim",
                                                                        //     }).done(xhr => {
                                                                        //         if (xhr.status === EnumStatus.OK) {
                                                                        //             OGUtils.alert("Tạo người sử dụng mới thành công!").then(() => {
                                                                        //                 this.userGrid.getDataSource().reload();
                                                                        //                 this.userInfoPopup.hide();
                                                                        //             });
                                                                        //         }
                                                                        //     });
                                                                        // }
                                                                    });
                                                                } else {
                                                                    OGUtils.alert(xhr.errors[0].message);
                                                                }
                                                            });
                                                        } else {
                                                            $.ajax({
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
                                                    this.userInfoPopup.hide();
                                                },
                                                stylingMode: "contained",
                                                text: "Hủy",
                                                type: "danger"
                                            },
                                            widget: "dxButton"
                                        }]
                                    });
                            }

                        }],
                        labelLocation: "top"
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
            toolbarItems: [{
                location: "center",
                text: "Thêm tài khoản"
            },],
            width: 580,
        }).dxPopup("instance");

        this.userGrid = $("<div>").appendTo(container).dxDataGrid({
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
                    const pageIndex = this.userGrid.pageIndex();
                    const pageSize = this.userGrid.pageSize();
                    container.append(`${(pageSize * pageIndex) + options.row.rowIndex + 1}`);
                },
                dataField: "index",
                width: 50,
            }, {
                caption: "Nhóm người dùng",
                dataField: "groups[0].id",
                groupIndex: 1,
                lookup: {
                    dataSource: this.userGroupStore,
                    displayExpr: "Name",
                    valueExpr: "Id"
                }
            }, {
                caption: "Trạng thái hoạt động",
                customizeText: (e) => {
                    return e.value ? "Đang bị khóa" : "Đang hoạt động";
                },
                dataField: "lockout_enabled",
                // groupCellTemplate: (container, options) => {
                //     const text = options.data.key ? "Đang bị khóa" : "Đang hoạt động";
                //     container.append("<span> Trạng thái hoạt động: " + text + "</span>");
                //     if (options.data.key) {
                //         container.parent().addClass("user-locked");
                //     } else {
                //         container.parent().addClass("user-unlocked");
                //     }
                // },
                groupIndex: 0
            }, {
                caption: "Tên đăng nhập",
                dataField: "user_name",
                width: 150
            }, {
                caption: "Thông tin người dùng",
                cellTemplate: (container, options) => {
                    container.append(Handlebars.compile(UserInfoTemp)(options.data));
                },
                dataField: "userInfo.user_id",
            }, {
                caption: "Quận/huyện",
                dataField: "userInfo.district_code",
                lookup: {
                    allowClearing: true,
                    dataSource: {
                        store: this.districtStore
                    },
                    displayExpr: "name_vn",
                    valueExpr: "area_id",
                },
                width: 200
            }, {
                caption: "Tên đầy đủ",
                dataField: "userInfo.full_name",
                visible: false,
            }, {
                caption: "Đơn vị công tác",
                dataField: "userInfo.unit",
                visible: false,
            }, {
                caption: "Vị trí",
                dataField: "userInfo.position",
                visible: false,
            }, {
                caption: "Email",
                dataField: "email",
                visible: false,
                width: 200
            }, {
                caption: "Di động",
                dataField: "phone_number",
                visible: false,
                width: 100
            }, {
                caption: "Nhận cảnh báo qua SMS",
                dataField: "userInfo.send_sms",
                editorOptions: {
                    onInitialized: function (e) {
                        e.component.option("value", Boolean(e.component.option("value")));
                    }
                },
                width: 100,
            }, {
                caption: "Nhận cảnh báo qua ứng dụng",
                dataField: "userInfo.send_app",
                editorOptions: {
                    onInitialized: function (e) {
                        e.component.option("value", Boolean(e.component.option("value")));
                    }
                },
                width: 100
            }, {
                caption: "Nhận cảnh báo qua Email",
                dataField: "userInfo.send_mail",
                editorOptions: {
                    onInitialized: function (e) {
                        e.component.option("value", Boolean(e.component.option("value")));
                    }
                },
                width: 100,
            }, {
                caption: "Nhập liệu không cần phê duyệt",
                dataField: "userInfo.bypass_approve",
                editorOptions: {
                    onInitialized: function (e) {
                        e.component.option("value", Boolean(e.component.option("value")));
                    }
                },
                width: 100,
            }, {
                alignment: "center",
                allowEditing: false,
                caption: "Thao tác",
                cellTemplate: (container, options) => {
                    $("<div>").appendTo(container).dxToolbar({
                        items: [{
                            location: "center",
                            options: {
                                disabled: options.data.permanent,
                                hint: "Chuyển nhóm người dùng",
                                icon: "icon icon-3d-rotate",
                                onClick: () => {
                                    const data = options.data;
                                    data.GroupId = (data.groups.length > 0) ? data.groups[0].id : "";
                                    this.moveUserForm.option("formData", data);
                                    this.moveUserPopup.show();
                                },
                                type: "default"
                            },
                            widget: "dxButton"
                        }, {
                            location: "center",
                            options: {
                                hint: "Cập nhật thông tin người dùng",
                                icon: "icon icon-edit-2",
                                onClick: () => {
                                    // const data = options.data;
                                    // const formData = {
                                    //     DistrictId: data.user_info.district_code,
                                    //     Email: data.email,
                                    //     FullName: data.user_info.full_name,
                                    //     GroupId: (data.groups.length > 0) ? data.groups[0].id : "",
                                    //     Notification: data.notification,
                                    //     PhoneNumber: data.phone_number,
                                    //     Position: data.user_info.position,
                                    //     SendApp: data.user_info.send_app,
                                    //     SendMail: data.user_info.send_mail,
                                    //     SendSms: data.user_info.send_sms,
                                    //     Unit: data.user_info.unit,
                                    //     UserId: data.id,
                                    //     UserName: data.user_name,
                                    // };
                                    // this.userInfoForm.option("formData", formData);
                                    // this.userInfoPopup.show();
                                    this.userGrid.editRow(options.rowIndex);
                                },
                                type: "success"
                            },
                            widget: "dxButton"
                        }, {
                            location: "center",
                            options: {
                                disabled: options.data.permanent,
                                hint: "Xóa người dùng",
                                icon: "icon icon-trash",
                                onClick: () => {
                                    OGUtils.confirm("Bạn muốn xóa người sử dụng này?").then(value => {
                                        if (value) {
                                            options.component.getDataSource().store().remove(options.value).then(() => {
                                                options.component.getDataSource().reload();
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
                                    icon: (options.data.lockout_enabled) === false ? "icon icon-lock" : "icon icon-lock-slash",
                                    onClick: () => {
                                        const confirmText = options.data.lockout_enabled ? "Bạn muốn mở khóa người dùng này?" : "Bạn muốn khóa người dùng này?";
                                        options.data.LockoutEnabled = options.data.lockout_enabled;
                                        OGUtils.confirm(confirmText).then(value => {
                                            if (value) {
                                                $.ajax({
                                                    contentType: "application/json",
                                                    data: JSON.stringify(options.data),
                                                    error: () => {
                                                        OGUtils.toastError("Mở khóa thất bại!");
                                                    },
                                                    success: (xhr) => {
                                                        if (xhr.status === EnumStatus.OK) {
                                                            OGUtils.toast("Mở khóa thành công!");
                                                        } else {
                                                            OGUtils.toastError("Mở khóa thất bại!");
                                                        }
                                                        this.userGrid.getDataSource().reload();
                                                    },
                                                    type: "post",
                                                    url: "/api/user/setLock"
                                                });
                                            }
                                        });
                                    },
                                    text: (options.data.lockout_enabled) === false ? "Khóa người dùng" : "Mở khóa người dùng",
                                    type: "default",
                                }, {
                                    hint: "Đổi mật khẩu",
                                    icon: "icon icon-keyboard",
                                    onClick: () => {
                                        this.userGrid.option("userName", options.data.user_name);
                                        this.changePasswordPopup.show();
                                    },
                                    text: "Đổi mật khẩu",
                                    type: "default"
                                }, {
                                    disabled: options.data.permanent,
                                    hint: "Phân quyền",
                                    icon: "icon icon-people",
                                    onClick: () => {
                                        OGUtils.showLoading();
                                        this.userId = options.data.id;
                                        this.newRegionData = true;
                                        this.regionRoleTree["userId"] = options.value;
                                        this.regionRoleTree.getDataSource().reload();
                                        // Quyền sử dụng lớp dữ liệu
                                        $.when($.get("/api/user/getLayerRoles", { id: options.data.id }),
                                            $.get("/api/user/getTableRoles", { id: options.data.id }),
                                            $.get("/api/user/getPermissionRoles", { id: options.data.id }),
                                            // $.get("/api/user/getRegionRoles", { id: options.data.id }),
                                            // $.get("/api/user/folders", { id: options.data.id }),
                                            // $.get("/api/user/reports", { id: options.data.id })
                                        ).done((layers, tables, permissions) => {
                                            OGUtils.hideLoading();
                                            //* Phân quyền lớp dữ liệu
                                            this.layerPermissionTree.beginUpdate();
                                            this.layerPermissionTree.option("dataSource.store",
                                                new CustomStore({
                                                    key: "id",
                                                    load: () => {
                                                        const def = $.Deferred();
                                                        if (layers[0].status === EnumStatus.OK) {
                                                            def.resolve({
                                                                data: layers[0].data,
                                                                totalCount: layers[0].data.length
                                                            });
                                                        } else {
                                                            def.resolve({
                                                                data: [],
                                                                totalCount: 0
                                                            });
                                                        }
                                                        return def.promise();
                                                    }
                                                })
                                            );
                                            this.layerPermissionTree.endUpdate();
                                            this.layerPermissionTree["userId"] = options.value;
                                            //* Phân quyền bảng dữ liệu
                                            this.tablePermissionTree.beginUpdate();
                                            this.tablePermissionTree.option("dataSource.store",
                                                new CustomStore({
                                                    key: "id",
                                                    load: () => {
                                                        const def = $.Deferred();
                                                        if (tables[0].status === EnumStatus.OK) {
                                                            def.resolve({
                                                                data: tables[0].data,
                                                                totalCount: tables[0].data.length
                                                            });
                                                        } else {
                                                            def.resolve({
                                                                data: [],
                                                                totalCount: 0
                                                            });
                                                        }
                                                        return def.promise();
                                                    }
                                                })
                                            );
                                            this.tablePermissionTree.endUpdate();
                                            this.tablePermissionTree["userId"] = options.value;
                                            //* Phân quyền chức năng
                                            this.permissionRoleTree.beginUpdate();
                                            this.permissionRoleTree.option("dataSource.store",
                                                new CustomStore({
                                                    key: "id",
                                                    load: () => {
                                                        const def = $.Deferred();
                                                        if (permissions[0].status === EnumStatus.OK) {
                                                            def.resolve({
                                                                data: permissions[0].data,
                                                                totalCount: permissions[0].data.length
                                                            });
                                                        } else {
                                                            def.resolve({
                                                                data: [],
                                                                totalCount: 0
                                                            });
                                                        }
                                                        return def.promise();
                                                    }
                                                })
                                            );
                                            this.permissionRoleTree.endUpdate();
                                            this.permissionRoleTree["userId"] = options.value;
                                            //* Phân quyền hành chính
                                            // this.regionRoleTree.beginUpdate();
                                            // this.regionRoleTree.option("dataSource.store",
                                            //     new CustomStore({
                                            //         key: "id",
                                            //         load: () => {
                                            //             const def = $.Deferred();
                                            //             if (regions[0].status === EnumStatus.OK) {
                                            //                 def.resolve({
                                            //                     data: regions[0].data,
                                            //                     totalCount: regions[0].data.length
                                            //                 });
                                            //             } else {
                                            //                 def.resolve({
                                            //                     data: [],
                                            //                     totalCount: 0
                                            //                 });
                                            //             }
                                            //             return def.promise();
                                            //         }
                                            //     })
                                            // );
                                            // this.regionRoleTree.endUpdate();
                                            // this.regionRoleTree["userId"] = options.value;
                                            //* Phân quyền thư mục
                                            // if (this.foldersTree) {
                                            //     this.foldersTree.beginUpdate();
                                            //     this.foldersTree.option("dataSource.store",
                                            //         new CustomStore({
                                            //             key: "id",
                                            //             load: () => {
                                            //                 const def = $.Deferred();
                                            //                 if (folders[0].status === EnumStatus.OK) {
                                            //                     def.resolve({
                                            //                         data: folders[0].data,
                                            //                         totalCount: folders[0].data.length
                                            //                     });
                                            //                 } else {
                                            //                     def.resolve({
                                            //                         data: [],
                                            //                         totalCount: 0
                                            //                     });
                                            //                 }
                                            //                 return def.promise();
                                            //             }
                                            //         })
                                            //     );
                                            //     this.foldersTree.endUpdate();
                                            //     this.foldersTree["userId"] = options.value;
                                            // }
                                            // //* Phân quyền báo cáo
                                            // this.reportRoleTree.beginUpdate();
                                            // this.reportRoleTree.option("dataSource.store",
                                            //     new CustomStore({
                                            //         key: "id",
                                            //         load: () => {
                                            //             const def = $.Deferred();
                                            //             if (reports[0].status === EnumStatus.OK) {
                                            //                 def.resolve({
                                            //                     data: reports[0].data,
                                            //                     totalCount: reports[0].data.length
                                            //                 });
                                            //             } else {
                                            //                 def.resolve({
                                            //                     data: [],
                                            //                     totalCount: 0
                                            //                 });
                                            //             }
                                            //             return def.promise();
                                            //         }
                                            //     })
                                            // );
                                            // this.reportRoleTree.endUpdate();
                                            // this.reportRoleTree["userId"] = options.value;

                                            const layerTableId = layers[0]?.data?.map(x => x.items.filter(x => x.selected && x.raw)).flat().map(x => x.raw.table_info_id);
                                            const tableId = tables[0]?.data?.map(x => x.items.filter(x => x.selected && x.raw)).flat().map(x => x.raw.id);
                                            const distinct = OGUtils.distinct(layerTableId.concat(tableId));
                                            self.refreshColumns = false;
                                            this.columnsTree["userId"] = options.value;
                                            this.columnsTree.beginUpdate();
                                            this.columnsTree.option("dataSource.store",
                                                new CustomStore({
                                                    key: "id",
                                                    load: () => {
                                                        const def = $.Deferred();
                                                        $.ajax({
                                                            contentType: "application/json",
                                                            data: JSON.stringify({
                                                                table_ids: distinct,
                                                                user_id: this.columnsTree["userId"]
                                                            }),
                                                            type: "POST",
                                                            url: "/api/user/user-columns",
                                                        }).done(xhr => {
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
                                            this.columnsTree.endUpdate();

                                            this.roleToolbar.option("items[1].options.value", null);
                                            this.roleToolbar.option("items[1].options.value", options.row.data.role);
                                            this.roleToolbar.option("visible", true);

                                            this.roleTab.option("selectedIndex", 0);
                                            this.rolePopup.show();
                                        });
                                    },
                                    text: "Phân quyền",
                                    type: "default"
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
                store: this.userStore
            }),
            disabled: false,
            editing: {
                form: {
                    colCount: 2,
                    items: [
                        {
                            dataField: "user_name",
                            editorOptions: {
                                disabled: true,
                            },
                        }, {
                            dataField: "userInfo.full_name",
                            validationRules: [{
                                message: "Vui lòng nhập tên đăng nhập đẩy đủ",
                                type: "required",
                            }, {
                                message: "Không được nhập giá trị có chưa mã nguồn",
                                type: "custom",
                                validationCallback: (e) => {
                                    if (e.value) {
                                        return !OGUtils.hasHtmlTag(e.value);
                                    }
                                    return true;
                                }
                            }, {
                                message: "Không được nhập giá trị có kí tự đặc biệt",
                                type: "custom",
                                validationCallback: (e) => {
                                    if (e.value) {
                                        return !OGUtils.hasSpecialChar(e.value);
                                    }
                                    return true;
                                }
                            },],
                        }, {
                            dataField: "email",
                            validationRules: [
                                //     {
                                //     message: "Vui lòng nhập email",
                                //     type: "required"
                                // }, 
                                {
                                    message: "Vui lòng nhập đúng định dạng email",
                                    type: "email",
                                }]
                        }, {
                            dataField: "phone_number",
                            validationRules: [
                                //     {
                                //     message: "Vui lòng nhập số điện thoại",
                                //     type: "required"
                                // }, 
                                {
                                    message: "Vui lòng nhập số điện thoại đúng định dạng",
                                    pattern: /^[02-9]\d{9}$/,
                                    type: "pattern",
                                }]
                        }, {
                            dataField: "userInfo.unit"
                        }, {
                            dataField: "userInfo.position"
                        }, {
                            dataField: "userInfo.district_code",
                        }, {
                            dataField: "userInfo.send_sms",
                            editorOptions: {
                                onInitialized: function (e) {
                                    e.component.option("value", Boolean(e.component.option("value")));
                                }
                            },
                            editorType: "dxCheckBox",
                        }, {
                            dataField: "userInfo.send_app",
                            editorOptions: {
                                onInitialized: function (e) {
                                    e.component.option("value", Boolean(e.component.option("value")));
                                }
                            },
                            editorType: "dxCheckBox",
                        }, {
                            dataField: "userInfo.send_mail",
                            editorOptions: {
                                onInitialized: function (e) {
                                    e.component.option("value", Boolean(e.component.option("value")));
                                }
                            },
                            editorType: "dxCheckBox",
                        }, {
                            dataField: "userInfo.bypass_approve",
                            editorOptions: {
                                onInitialized: function (e) {
                                    e.component.option("value", Boolean(e.component.option("value")));
                                }
                            },
                            editorType: "dxCheckBox",
                        }],
                    labelLocation: "top"
                },
                mode: "popup",
                popup: {
                    height: "auto",
                    showTitle: true,
                    title: "Thông tin người dùng",
                    width: 600
                },
                texts: {
                    cancelRowChanges: "Hủy",
                    saveRowChanges: "Lưu",
                },
                useIcons: false
            },
            errorRowEnabled: false,
            height: "100%",
            loadPanel: {
                text: "Đang tải dữ liệu"
            },
            noDataText: "Không có dữ liệu",
            onCellPrepared: (e) => {
                if (e.rowType == "data") {
                    const data = e.row.data;
                    if (data.lockout_enabled) {
                        e.cellElement.addClass("user-locked");
                    } else {
                        e.cellElement.addClass("user-unlocked");
                    }
                }
            },
            onEditorPreparing(e) {
                if (e.parentType === "dataRow" && (e.dataField === "user_info.send_app" || e.dataField === "user_info.send_mail" || e.dataField === "user_info.send_sms")) {
                    e.editorOptions.value = e.value === true;
                }
            },
            onRowUpdating: function (options) {
                if (options.newData.userInfo && options.oldData.userInfo) {
                    if (options.newData.userInfo.full_name == undefined) {
                        options.newData.userInfo.full_name = options.oldData.userInfo.full_name;
                    }
                    if (options.newData.userInfo.unit == undefined) {
                        options.newData.userInfo.unit = options.oldData.userInfo.unit;
                    }
                    if (options.newData.userInfo.position == undefined) {
                        options.newData.userInfo.position = options.oldData.userInfo.position;
                    }
                    if (options.newData.userInfo.district_code == undefined) {
                        options.newData.userInfo.district_code = options.oldData.userInfo.district_code;
                    }
                    if (options.newData.userInfo.send_mail == undefined) {
                        options.newData.userInfo.send_mail = options.oldData.userInfo.send_mail;
                    }
                    if (options.newData.userInfo.send_app == undefined) {
                        options.newData.userInfo.send_app = options.oldData.userInfo.send_app;
                    }
                    if (options.newData.userInfo.send_sms == undefined) {
                        options.newData.userInfo.send_sms = options.oldData.userInfo.send_sms;
                    }
                    if (options.newData.userInfo.bypass_approve == undefined) {
                        options.newData.userInfo.bypass_approve = options.oldData.userInfo.bypass_approve;
                    }
                }
                $.extend(options.newData, $.extend({}, options.oldData, options.newData));
            },
            pager: {
                allowedPageSizes: [50, 100, 200],
                infoText: "{2} bản ghi",
                showInfo: true,
                showNavigationButtons: true,
                showPageSizeSelector: true,
                visible: true,
                /*displayMode: 'compact'*/
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
            toolbar: {
                items: [{
                    options: {
                        icon: "icon icon-user-add",
                        onClick: () => {
                            this.userInfoPopup.show();
                            this.userInfoForm.resetValues();
                        },
                        text: "Thêm tài khoản",
                        type: "default"
                    },
                    widget: "dxButton"
                }, {
                    options: {
                        dataSource: {
                            store: new CustomStore({
                                key: "Id",
                                load: () => {
                                    const def = $.Deferred();

                                    $.get("/api/group/list").done(xhr => {
                                        if (xhr.status === EnumStatus.OK && xhr.data.length > 0) {
                                            const dataSource = [{
                                                Id: "Orphan",
                                                Name: "Người dùng không thuộc nhóm nào",
                                            }];
                                            $.each(xhr.data, function (idx, item) {
                                                dataSource.push({
                                                    Id: item.Id,
                                                    Name: item.Name,
                                                });
                                            });
                                            def.resolve(dataSource);
                                        } else {
                                            def.resolve([]);
                                        }
                                    });
                                    return def.promise();
                                },
                                loadMode: "raw"
                            })
                        },
                        displayExpr: "Name",
                        onContentReady: () => {
                            $(".dx-list-item-content").each(function () {
                                const $ele = $(this);
                                if (this.offsetWidth < this.scrollWidth) {
                                    $ele.attr("title", $ele.text());
                                }
                            });
                        },
                        onSelectionChanged: function (e) {
                            self.selectedUserGroupID = e.component.option("value");
                            self.userGrid.getDataSource().reload();
                        },
                        placeholder: "Chọn nhóm người dùng",
                        searchEnabled: true,
                        showClearButton: true,
                        valueExpr: "Id",
                        width: 250,
                    },
                    widget: "dxSelectBox"
                }, {
                    options: {
                        hint: "Làm mới bảng",
                        icon: "icon icon-refresh",
                        onClick: (e) => {
                            this.userGrid.getDataSource().reload();
                        }
                    },
                    widget: "dxButton"
                }, "searchPanel"]
            },
            width: "100%",
        }).dxDataGrid("instance");

        this.moveUserPopup = $("<div />").appendTo("body").dxPopup({
            contentTemplate: (container) => {
                this.moveUserForm = $("<form />").appendTo(container)
                    .dxForm({
                        formData: {
                            GroupId: "",
                            UserId: "",
                        },
                        items: [{
                            dataField: "UserId",
                            visible: false
                        }, {
                            dataField: "GroupId",
                            editorOptions: {
                                dataSource: new DataSource({
                                    store: this.userGroupStore
                                }),
                                displayExpr: "Name",
                                placeholder: "[Chọn...]",
                                searchEnabled: true,
                                valueExpr: "Id",
                                width: "100%",
                            },
                            editorType: "dxSelectBox",
                            label: {
                                text: "Nhóm mới",
                            },
                            validationRules: [{
                                message: "Vui lòng chọn nhóm muốn chuyển người dùng đến",
                                type: "required"
                            }]
                        }, {
                            template: () => {
                                return "<hr style=\"margin: 5px 0;\" />";
                            }
                        }, {
                            template: (itemData, itemElement) => {
                                $("<div />").appendTo(itemElement)
                                    .dxToolbar({
                                        items: [{
                                            options: {
                                                onClick: () => {
                                                    const validate = this.moveUserForm.validate();
                                                    if (validate && validate.brokenRules.length === 0) {
                                                        const formData = this.moveUserForm.option("formData");
                                                        const data = {
                                                            DistrictId: formData.user_info.district_code,
                                                            Email: formData.email,
                                                            FullName: formData.user_info.full_name,
                                                            GroupId: formData.GroupId,
                                                            Notification: formData.notification,
                                                            PhoneNumber: formData.phone_number,
                                                            Position: formData.user_info.position,
                                                            SendApp: formData.user_info.send_app,
                                                            SendMail: formData.user_info.send_mail,
                                                            SendSms: formData.user_info.send_sms,
                                                            Unit: formData.user_info.unit,
                                                            UserId: formData.id,
                                                            UserName: formData.user_name
                                                        };
                                                        $.ajax({
                                                            contentType: "application/json",
                                                            data: JSON.stringify(data),
                                                            success: xhr => {
                                                                if (xhr.status === EnumStatus.OK) {
                                                                    $.ajax({
                                                                        contentType: "application/json",
                                                                        data: JSON.stringify(data),
                                                                        type: "POST",
                                                                        url: "/api/user/saveOfUpdateRole",
                                                                    }).done(xhr => {
                                                                        if (xhr.status === EnumStatus.OK) {
                                                                            OGUtils.alert("Chuyển người sử dụng sang nhóm mới thành công!").then(() => {
                                                                                this.userGrid.getDataSource().reload();
                                                                                this.moveUserPopup.hide();
                                                                            });
                                                                        }
                                                                    });
                                                                } else {
                                                                    OGUtils.alert(xhr.errors[0].message);
                                                                }
                                                            },
                                                            type: "POST",
                                                            url: "/api/user/move",
                                                        });
                                                    }
                                                },
                                                text: "Lưu",
                                                type: "default"
                                            },
                                            widget: "dxButton"
                                        }, {

                                            options: {
                                                onClick: () => {
                                                    this.moveUserPopup.hide();
                                                },

                                                text: "Hủy",
                                                type: "danger"
                                            },
                                            widget: "dxButton"
                                        }]
                                    });
                            }
                        }],
                        scrollingEnabled: true
                    }).dxForm("instance");
            },
            deferRendering: false,
            dragEnabled: false,
            height: "auto",
            hideOnOutsideClick: false,
            onOptionChanged: () => {
            },
            position: {
                at: "center",
                my: "center",
                of: window
            },
            resizeEnabled: false,
            shading: true,
            showCloseButton: true,
            showTitle: true,
            title: "Chuyển người dùng sang nhóm khác",
            width: "400px",
        }).dxPopup("instance");
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
    public addUserGroupView(userGroupView: dxMultiView): void {
        this.userGroupView = userGroupView;
        this.userGrid.option("toolbar.items", [{
            location: "before",
            options: {
                hint: "Quay lại",
                icon: "icon icon-arrow-left",
                onClick: () => {
                    this.userGroupView.option("selectedIndex", 0);
                },
                type: "danger"
            },
            widget: "dxButton"
        }, {
            options: {
                icon: "icon icon-user-add",
                onClick: () => {
                    this.userInfoPopup.show();
                    this.userInfoForm.resetValues();
                },
                text: "Thêm tài khoản",
                type: "default"
            },
            widget: "dxButton"
        }, {
            options: {
                hint: "Làm mới bảng",
                icon: "icon icon-refresh",
                onClick: (e) => {
                    this.userGrid.getDataSource().reload();
                }
            },
            widget: "dxButton"
        }]);
    }
    onInit(): void {
    }
    public reload(userGroupId): void {
        this.selectedUserGroupID = userGroupId;
        this.userGrid.getDataSource().reload();
    }
}

export { UserGridView };