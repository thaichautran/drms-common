import { OGLayerModel } from "./layer.model";
import { OGTableSchemaModel } from "./table.model";

interface HeThongTichHopModel {
    created_at?: Date;
    id: number;
    is_integrated?: boolean;
    layer?: OGLayerModel;
    layer_id?: number;
    listDinhKem?: HeThongTichHopThoiGianModel[]
    mo_ta?: string;
    updated_at?: Date;
    url?: string;
}

interface HeThongTichHopThoiGianModel {
    heThong?: HeThongTichHopModel;
    hethong_id?: number;
    id?: number;
    schema?: OGTableSchemaModel;
    schema_name?: string;
    thoigian_thietlap?: string;
}

export {
    HeThongTichHopModel,
    HeThongTichHopThoiGianModel
};