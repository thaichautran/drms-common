class OGConfigModel {
    BaseMapUrl: string;
    CDNUrl: string;
    DocumentPath: string;
    DocumentUploadPath: string;
    ImagePath: string;
    ImageUploadPath: string;
    Permissions: string[];
    SAOrAdministrator: boolean;
    isAdmin: boolean;
    isSA: boolean;

    public canCreate(permission?: string): boolean {
        if (this.isSA || this.isAdmin) {
            return true;
        }
        return this.Permissions.toString().indexOf(".add") >= 0;
    }

    public canDelete(permission?: string): boolean {
        if (this.isSA || this.isAdmin) {
            return true;
        }
        return this.Permissions.toString().indexOf(".delete") >= 0;
    }

    public canNotify(): boolean {
        if (this.isSA || this.isAdmin) {
            return true;
        }
        return this.Permissions.toString().indexOf(".notify") >= 0;
    }
    public canUpdate(permission?: string): boolean {
        if (this.isSA || this.isAdmin) {
            return true;
        }
        return this.Permissions.toString().indexOf(".update") >= 0;
    }

    public hasPermission(permission: string): boolean {
        if (this.isSA || this.isAdmin) {
            return true;
        }
        return this.Permissions.indexOf(permission) >= 0;
    }
}

export { OGConfigModel };