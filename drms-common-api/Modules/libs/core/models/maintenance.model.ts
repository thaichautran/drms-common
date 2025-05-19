import { OGThongTinTraoDoiModel } from "./kiem-tra/kiem-tra.model";
import { OGNhanVienModel } from "./nhan-vien.model";

interface OGWorderModel {
    a_note: string,
    a_result_sum: string,
    actual_finish_date: Date | string
    actual_start_date: Date | string
    asset_id: number,
    assetid_owner: string,
    deleteMaintenanceFileIds: string,
    deleteProcessExists: OGProcessExistModel[],
    fc_finish_date: Date | string
    fc_note: string,
    fc_start_date: Date | string
    file_attach_counter: number,
    grid_edit: boolean,
    is_exec: boolean,
    is_fore_cast: boolean,
    is_plan: boolean,
    is_processExist: boolean,
    list_sign: string,
    lock_date: Date | string
    lock_mode: number,
    lock_note: string,
    maintenanceChats: OGThongTinTraoDoiModel[]
    maintenanceFiles: OGMaintenanceFileModel[],
    maintenanceWorkers: OGMaintenanceWorkerModel[],
    obj_type_id: number,
    ord_sign: number,
    org_id: number,
    p_note: string,
    plan_finish_date: Date | string
    plan_start_date: Date | string
    pm_counter: number
    pm_id: string,
    pm_job_id: string,
    problem_id: number,
    processExists: OGProcessExistModel[],
    progress: number,
    user_cr_dtime: Date | string
    user_cr_id: string,
    user_mdf_dtime: Date | string
    user_mdf_id: string,
    wdesc: string,
    wdesc_info: string,
    wdesc_more: string,
    wkind_id: number,
    worder_id : number,
    worder_id_org: number  ,
    worderAssetViews: []
    worderAssets: OGWorderAssetModel[],

    worg_id: number,
    wstatus_id_all: number,
    wstatus_id_ex: number,
    wstatus_id_fc: number,
    wstatus_id_pl: number,
    wtype_id: number,
    wtype_result_id: number,
}
interface OGWorderAssetModel {
    asset_id: string,
    asset_name: string,
    id: number,
    layer_id: number,
    layer_name: string,
    worder?: OGWorderModel
    worder_id?: number,
}
interface OGProcessExistModel {
    asset_id: string,
    attr_desc: string
    attr_id: string,
    command_desc: string,
    date_command: Date | string
    date_exec: Date | string
    date_plan_exec: Date | string
    date_solution_exist: Date | string
    desc_exec: string,
    obj_id: number,
    obj_type_id: number,
    process_exist_id : number,
    solution_exist: string,
    solution_exist_mobile: string,
    status: number,
    status_id: number,
    type_id: string,
    user_cr_dtime: Date | string
    user_cr_id: string,
    user_id_command: string,
    user_id_exec: string,
    user_mdf_dtime: Date | string
    user_mdf_id: string,
    worder_id_exec: string,
}
interface OGMaintenanceFileModel {
    extension: string,
    file?: Blob | File,
    file_name?: string ,
    id? : number,
    image_name?: string,
    maintenance_id?: number,
    mime_type: string,
    raw?: Blob | File,
    size: number,
    uid?: string,
    url: string,
    worder?: OGWorderModel,
}

interface OGMaintenanceWorkerModel {
    ghichu?: string;
    maintenance_id? : number,
    worder?: OGWorderModel;
    worker?: OGNhanVienModel;
    worker_id? :number;
}

interface OGAttributeInfoItem {
    key: string,
    label: string,
    order: number,
    value: string
}

class OGMachineryModel {
    ghichu?: string;
    id?: number;
    loaikiemtra?: string;
    tenphuongtien?: string;
    tinhtrang?: string;
}

class OGCalendarTreeModel {
    bienphapthicong?: string;
    chieucao?: number;
    diachi?: string;
    duongking?: number;
    hientrangid?: string;
    id?: number;
    lichcat?: string;
    loaicay?: string;
    macay?: string;
    tuyenduong?: string;
    vitri?: string;

}

export { 
    OGAttributeInfoItem,
    OGCalendarTreeModel, 
    OGMachineryModel,
    OGMaintenanceFileModel, 
    OGMaintenanceWorkerModel,
    OGProcessExistModel,
    OGWorderAssetModel,
    OGWorderModel,
};