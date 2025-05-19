import Axios, { AxiosResponse } from "axios";

import { EnumStatus } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { RestData, RestPagedDatatable } from "../../models/base-response.model";
import { OGPhieuGiamSatKiemTraGiaoThongModel } from "../../models/kiem-tra/phieu-kiem-tra-giao-thong.model";

class PhieuKiemTraGiaoThongService {
    static delete(data: OGPhieuGiamSatKiemTraGiaoThongModel): Promise<void> {
        return Axios.delete("/api/giao-thong/kiem-tra/" + data.id).then(async (xhr: AxiosResponse<RestData<OGPhieuGiamSatKiemTraGiaoThongModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                if(xhr.data.status == EnumStatus.OK) {
                    OGUtils.alert("Xóa phiếu giám sát giao việc kiểm tra thành công!");
                } else {
                    OGUtils.error("Đã xảy ra lỗi, vui lòng kiểm tra lại!");
                }
            }
        }).catch(e => {
            throw e;
        });
    }

    static get(id: number): Promise<OGPhieuGiamSatKiemTraGiaoThongModel> {
        if (id === 0) {
            return undefined;
        }
        return Axios.get(`/api/giao-thong/kiem-tra/${id}`).then(async (xhr: AxiosResponse<RestData<OGPhieuGiamSatKiemTraGiaoThongModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static insert(data: OGPhieuGiamSatKiemTraGiaoThongModel): Promise<OGPhieuGiamSatKiemTraGiaoThongModel> {
        return Axios({
            data: data,
            // headers: {
            //     "Content-Type": "application/x-www-form-urlencoded"
            // },
            method: "POST",
            url: "/api/giao-thong/kiem-tra/save"
        }).then(async (xhr: AxiosResponse<RestData<OGPhieuGiamSatKiemTraGiaoThongModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                if(xhr.data.status === EnumStatus.OK) {
                    return xhr.data.data;
                } 
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static list(params): Promise<RestPagedDatatable<OGPhieuGiamSatKiemTraGiaoThongModel[]>> {
        return Axios({
            data: params,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/giao-thong/kiem-tra/list"
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<OGPhieuGiamSatKiemTraGiaoThongModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
}

export { PhieuKiemTraGiaoThongService };