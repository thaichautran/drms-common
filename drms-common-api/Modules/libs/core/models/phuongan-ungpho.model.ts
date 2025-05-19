import { BaseCategory } from "./base-category.model";
import { OGMapModel } from "./map.model";

interface PhuongAnUngPhoModel {
    cap_phuongan_id?: number;
    commune_code?: string;
    district_code?: string;
    id?: number;
    listPhuongAnMap?: PhuongAnMapModel[];
    listPhuongAnThienTai?: PhuongAnThienTaiModel[];
    loai_phuongan_id?: number;
    map?: OGMapModel;
    mo_ta?: string;
    nam_xaydung?: number;
    province_code?: string;
    ten_phuongan?: string;
}

interface PhuongAnThienTaiModel {

    loai_thientai_id: number;
    loaiThienTai: BaseCategory;
    phuongAn: PhuongAnUngPhoModel;
    phuongan_id: number;
}
interface PhuongAnMapModel {
    map: OGMapModel;
    map_id: number;
    phuongAn: PhuongAnUngPhoModel;
    phuongan_id: number;
}
interface XayDungPhuongAnUngPhoViewModel {
    map?: OGMapModel;
    phuongAn?: PhuongAnUngPhoModel;
}
export {
    PhuongAnMapModel,
    PhuongAnThienTaiModel,
    PhuongAnUngPhoModel,
    XayDungPhuongAnUngPhoViewModel
};