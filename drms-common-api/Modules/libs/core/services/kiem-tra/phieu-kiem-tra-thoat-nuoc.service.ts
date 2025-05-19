import Axios, { AxiosResponse } from "axios";

import { EnumStatus } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { RestData, RestPagedDatatable } from "../../models/base-response.model";
import { OGPhieuGiamSatKiemTraThoatNuocModel } from "../../models/kiem-tra/phieu-kiem-tra-thoat-nuoc.model";

class PhieuKiemTraThoatNuocService {
    static delete(data: OGPhieuGiamSatKiemTraThoatNuocModel): Promise<void> {
        return Axios.delete("/api/thoat-nuoc/kiem-tra/" + data.id).then(async (xhr: AxiosResponse<RestData<OGPhieuGiamSatKiemTraThoatNuocModel>>) => {
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

    static get(id: number): Promise<OGPhieuGiamSatKiemTraThoatNuocModel> {
        if (id === 0) {
            return undefined;
        }
        return Axios.get(`/api/thoat-nuoc/kiem-tra/${id}`).then(async (xhr: AxiosResponse<RestData<OGPhieuGiamSatKiemTraThoatNuocModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static insert(data: OGPhieuGiamSatKiemTraThoatNuocModel): Promise<OGPhieuGiamSatKiemTraThoatNuocModel> {
        return Axios({
            data: data,
            // headers: {
            //     "Content-Type": "application/x-www-form-urlencoded"
            // },
            method: "POST",
            url: "/api/thoat-nuoc/kiem-tra/save"
        }).then(async (xhr: AxiosResponse<RestData<OGPhieuGiamSatKiemTraThoatNuocModel>>) => {
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

    static list(params): Promise<RestPagedDatatable<OGPhieuGiamSatKiemTraThoatNuocModel[]>> {
        return Axios({
            data: params,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/thoat-nuoc/kiem-tra/list"
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<OGPhieuGiamSatKiemTraThoatNuocModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
}

export { PhieuKiemTraThoatNuocService };