import { OGLayerModel } from "./layer.model";

interface TichHopDuLieuModel {
    data_count?: number;
    id: number;
    is_integrated?: boolean;
    layer?: OGLayerModel;
    layer_id?: number;
    sync_date?: Date;
}
interface PhanPhoiDuLieuModel {
    data_count?: number;
    database_name?: string;
    id: number;
    ip_address?: string;
    is_integrated?: boolean;
    layer?: OGLayerModel;
    layer_id?: number;
    sync_date?: Date;
}

export {
    PhanPhoiDuLieuModel,
    TichHopDuLieuModel
};