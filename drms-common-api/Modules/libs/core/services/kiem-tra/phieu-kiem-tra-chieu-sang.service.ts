import Axios, { AxiosResponse } from "axios";

import { EnumStatus } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { RestBase, RestData, RestPagedDatatable } from "../../models/base-response.model";
import { OGPhieuGiamSatKiemTraChieuSangModel } from "../../models/kiem-tra/phieu-kiem-tra-chieu-sang.model";

class PhieuKiemTraChieuSangService {
    static delete(data: OGPhieuGiamSatKiemTraChieuSangModel): Promise<void> {
        return Axios.delete("/api/chieu-sang/kiem-tra/" + data.id).then(async (xhr: AxiosResponse<RestData<OGPhieuGiamSatKiemTraChieuSangModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                if (xhr.data.status == EnumStatus.OK) {
                    OGUtils.alert("Xóa phiếu giám sát giao việc kiểm tra thành công!");
                } else {
                    OGUtils.error("Đã xảy ra lỗi, vui lòng kiểm tra lại!");
                }
            }
        }).catch(e => {
            throw e;
        });
    }

    static get(id: number): Promise<OGPhieuGiamSatKiemTraChieuSangModel> {
        if (id === 0) {
            return undefined;
        }
        return Axios.get(`/api/chieu-sang/kiem-tra/${id}`).then(async (xhr: AxiosResponse<RestData<OGPhieuGiamSatKiemTraChieuSangModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static insert(data: OGPhieuGiamSatKiemTraChieuSangModel): Promise<OGPhieuGiamSatKiemTraChieuSangModel> {
        return Axios({
            data: data,
            // headers: {
            //     "Content-Type": "application/x-www-form-urlencoded"
            // },
            method: "POST",
            url: "/api/chieu-sang/kiem-tra/save"
        }).then(async (xhr: AxiosResponse<RestData<OGPhieuGiamSatKiemTraChieuSangModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                if (xhr.data.status === EnumStatus.OK) {
                    return xhr.data.data;
                }
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static list(params): Promise<RestPagedDatatable<OGPhieuGiamSatKiemTraChieuSangModel[]>> {
        return Axios({
            data: params,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/chieu-sang/kiem-tra/list"
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<OGPhieuGiamSatKiemTraChieuSangModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

}

export { PhieuKiemTraChieuSangService };