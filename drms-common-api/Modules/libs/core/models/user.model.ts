import { AreaModel } from "./area.model";

interface UserModel {
    avatar_path: string;
    citizen_identity: string;
    email: string;
    groups: UserGroupModel[];
    id: string;
    last_login: string;
    lockout_enabled: boolean;
    lockout_end?: string;
    notification: boolean;
    notification_info: unknown;
    phone_number: string;
    role: string;
    unit?: UnitModel;
    unread_notification_count: number;
    user_info: UserInfo;
    user_name: string;
}

interface UserInfo {
    address?: string;
    commune?: AreaModel;
    commune_code?: string;
    department_id: number;
    district?: AreaModel;
    district_code?: string;
    full_name: string;
}

interface UserGroupModel {
    code: string;
    description: string;
    id: string;
    lockout_enabled: boolean;
    name: string;
    parent_id: string;
    role_id: string;
}

interface UnitModel {
    active: boolean;
    id: string;
    note: string;
    unit_code: string;
    unit_name: string;
}

export interface Permission {
    id: number;
    module: Module;
    parent: Permission;
    parent_path: string;
    permission_name: string;
    permission_value: string;
}

export interface Module {
    id: string;
    text: string;
}

export { UnitModel, UserGroupModel, UserInfo, UserModel };