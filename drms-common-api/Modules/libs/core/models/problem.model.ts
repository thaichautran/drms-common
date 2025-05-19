import { OGNhanVienModel } from "./nhan-vien.model";

interface OGProblemModel {
    asset_id? : string;
    assets? : OGProblemAssetModel[];
    bienphap_khacphuc? : string;
    chitiet_suco? : string;
    dienbien?: string;
    donvi_quanly_id? : string;
    ghichu? : string;
    id?: number;
    loai_suco_id? : number;
    nguyennhan? : string;
    thoigian_capnhat_trangthai?: Date| string;
    thoigian_xayra_suco? : Date | string;
    trangthai_id? : number;
    year?: string;
}

interface OGProblemAssetModel {
    asset_id?: string;
    layer_id? : number;
    note? : string;
    problem?: OGProblemModel;
    problem_id? : number;
    worder_id?: number;
}

interface OGProcessProblemModel {
    ghichu?: string;
    id? : number;
    nhanvien_ids? : number[];
    problem? : OGProblemModel;

    problem_id? : number;
    processProblemWorkers?: OGProcessProblemWorkerModel[];
    thoigian_yeucau?: Date | string;
}

interface OGProcessProblemWorkerModel {
    nhanvien_id: number;
    process_problem_id? : number;
    worker? : OGNhanVienModel;
}

export { 
    OGProblemAssetModel, 
    OGProblemModel,
    OGProcessProblemModel,
    OGProcessProblemWorkerModel
};